
#include "ADS1256.h"
#include "Dev_config.h"

#include <unistd.h>
#include <math.h>

ADS1256::ADS1256()
{
    bPresentOnBus = false;
    
    m_gain = ADS1256_GAIN_1;
}


uint8_t ADS1256::Init()
{
	// ODROID spi bus starts uninitialized- CLK and MOSI lines are held high
	// This dummy read leaves lines at zero level
	DEV_SPI_ReadByte();
	
	PowerOn_();
	
    Reset_();
    
    // SPI protocol has no hardware aknowledge
    if(ReadChipID_() == 3)
    {
        printf("ADS1256 ID Read success\n");
        bPresentOnBus = true;
	}
    else
    {
        printf("ADS1256 ID Read failed\n");
        return 1;
    }
    
    return 0;
}


// Configure ADC gain and sampling speed
void ADS1256::ConfigADC(ADS1256_GAIN gain, uint8_t drate)
{
	if (!bPresentOnBus) return;
	
    uint8_t registers[4] = {0,0,0,0};
    
    // Without buffer input impedance is 150 kOhm at 1x PGA
    // With buffer input impedance is 80 MOhm
    // Buffer works only for voltages lower than vdd-2v
    registers[REG_STATUS] = ORDER_MSB_FIRST | ORDER_AUTO_CAL_DIS | ORDER_ABUFFER_EN;
    registers[REG_MUX]    = ADS1256_AIN3_P | ADS1256_AINCOM_N;
    registers[REG_ADCON]  = ADCON_CLK_OFF | ADCON_SENS_DTCT_OFF | gain;
    registers[REG_DRATE]  = drate;

    DEV_gpio_write(ADS1256_CS_PIN, 0);				// cs stays low during the whole command sequence
		DEV_SPI_WriteByte(CMD_WREG | REG_STATUS);	// address of the first register to be written
		DEV_SPI_WriteByte(0x03);					// number of registers to be written minus 1
		
		DEV_SPI_WriteByte(registers[0]);
		DEV_SPI_WriteByte(registers[1]);
		DEV_SPI_WriteByte(registers[2]);
		DEV_SPI_WriteByte(registers[3]);
    DEV_gpio_write(ADS1256_CS_PIN, 1);
    
    m_gain = gain;

    // wait until auto sampling comes back
    WaitDRDY_();
}


bool ADS1256::IsConnected()
{
	return bPresentOnBus;
}


// p.27 After reset calibartion registers are initialized to their default state
//      After reset release self-calibartion is performed
void ADS1256::Reset_()
{
    DEV_gpio_write(ADS1256_RST_PIN, 0);
    	DEV_Delay_ms(20);
    DEV_gpio_write(ADS1256_RST_PIN, 1);
        DEV_Delay_ms(20);

	// wait until auto sampling comes back
	WaitDRDY_();
}


void ADS1256::SelfCalibrate()
{
	// wait for nice opportunity
	WaitDRDY_();
	
	WriteCmd_(CMD_SELFCAL);
	
	// wait until auto sampling comes back
	WaitDRDY_();
}

// p.27 To exit power-down take the SYNC_PDWN high
//      Crystal oscillator typically requires 30ms to wake up
void ADS1256::PowerOn_()
{
   	DEV_gpio_write(ADS1256_SYNC_PDWN_PIN, 1);
        DEV_Delay_ms(30);

	// wait for auto sampling comes back
	WaitDRDY_();
}

// p.27 Toggle SYNC_PDWN pin low to restart conversion
//      reflecting changed parameters
void ADS1256::Sync_()
{
   	DEV_gpio_write(ADS1256_SYNC_PDWN_PIN, 0);
        DEV_Delay_us(30);
   	DEV_gpio_write(ADS1256_SYNC_PDWN_PIN, 1);
}

// Send a single byte command
void ADS1256::WriteCmd_(uint8_t cmd)
{
    DEV_gpio_write(ADS1256_CS_PIN, 0);
		DEV_SPI_WriteByte(cmd);
    DEV_gpio_write(ADS1256_CS_PIN, 1);
}

// Write the data to a destination register
void ADS1256::WriteReg_(uint8_t reg, uint8_t data)
{
    DEV_gpio_write(ADS1256_CS_PIN, 0);		// cs stays low during the whole command sequence
		DEV_SPI_WriteByte(CMD_WREG | reg);	// address of the first reigster to be written
		DEV_SPI_WriteByte(0x00);			// number of registers to be written minus 1
		DEV_SPI_WriteByte(data);
    DEV_gpio_write(ADS1256_CS_PIN, 1);
}

// Read a data from the destination register
uint8_t ADS1256::ReadReg_(uint8_t reg)
{
    uint8_t temp = 0;
    
    DEV_gpio_write(ADS1256_CS_PIN, 0);      // cs stays low during the whole command sequence
		DEV_SPI_WriteByte(CMD_RREG | reg);  // address of the first reigster to be written
		DEV_SPI_WriteByte(0x00);            // number of registers to be written minus 1
			DEV_Delay_us(10);               // t6 delay (50 x 7.68MHz)
		temp = DEV_SPI_ReadByte();
			DEV_Delay_us(20);               // min 1us
    DEV_gpio_write(ADS1256_CS_PIN, 1);
    
    return temp;
}

// DRDY goes low when new conversion data is available
void ADS1256::WaitDRDY_()
{   
    uint32_t i;
    for (i=0; i < 100000; i++)
    {
        if (DEV_gpio_read(ADS1256_DRDY_PIN) == 0)
			break;//return;
        else
			DEV_Delay_us(10);
    }
	
	// Expired timeout indicates that the operation is not working properly.
	
    //printf("DataReady time expired !\n"); 
    printf("Data ready: wait took %d us\n", i*10); 
}

// Read device ID
uint8_t ADS1256::ReadChipID_()
{
    uint8_t id = ReadReg_(REG_STATUS);
    
    printf("ReadReg: %d\n", id);
    
    return id >> 4;
}


void ADS1256::ConfigInputMultiplexer_(uint8_t uiPosNeg)
{
    WriteReg_(REG_MUX, uiPosNeg);
} 


float ADS1256::Read_ADCdata_()
{
    int32_t value = 0;
    uint8_t buf[3] = {0,0,0};
    
    WaitDRDY_();
    
    DEV_gpio_write(ADS1256_CS_PIN, 0);
		DEV_SPI_WriteByte(CMD_RDATA);
			DEV_Delay_us(10);					// t6 (50 CLK 7.68MHz)
		buf[2] = DEV_SPI_ReadByte();
		buf[1] = DEV_SPI_ReadByte();
		buf[0] = DEV_SPI_ReadByte();
    DEV_gpio_write(ADS1256_CS_PIN, 1);

    value = ((uint32_t)buf[2] << 16) | ((uint32_t)buf[1] << 8) | (uint32_t)buf[0];
    
    if (value & 0x800000)
    {
        // propagate negative complement
        value |= 0xFF000000;
	}
	
	float fValue = value;
	
	const float fMax   = 0x7FFFFF;
    const float VREF25 = 2.5f;

    fValue *= (2.0f*VREF25)/fMax;
    fValue /= powf(2.0f, m_gain); 
    
    return fValue;
}

// 
float ADS1256::GetChannelValue(uint8_t uiPosNeg)
{
    if (!bPresentOnBus) return 0.0f;
    
//	time_t rawtime;
//	time(&rawtime);
	
//	printf("\n%s", ctime(&rawtime));

	ConfigInputMultiplexer_(uiPosNeg);

    // wait for nice communication opportunity
    WaitDRDY_();
	
	Sync_();
	
	return Read_ADCdata_();
}



float ADS1256::GetThermistorResistance()
{
    if (!bPresentOnBus) return 0.0f;
    
	float fVoltage = GetChannelValue(ADS1256_AIN_THERMISTOR_V);
	
	// I  =            3v / (R1 + Rx + R2)
	// Vx = I*Rx = Rx* 3v / (R1 + Rx + R2)

	// Rx = Vx*(R1 + R2)/(3v - Vx)
	
	const float REF30_V  		 = 2.9795f;
	const float R1_R2_RESISTANCE = 1525.0f;	// <-- tweaked value to match physical resistance
	
	return fVoltage * (R1_R2_RESISTANCE + R1_R2_RESISTANCE) / (REF30_V - fVoltage);
}

// Returns ThC and ThR values to sample once
// Do not use, client calculates by itself !!
//~ float ADS1256::GetFlux(float& fThCvoltage, float& fThR)
//~ {
    //~ if (!bPresentOnBus) return 0.0f;
    
	//~ fThCvoltage = GetChannelValue(ADS1256_AIN_THERMOCOUPLE);
	//~ fThR        = GetThermistorResistance();
	
	//~ return ( (fThCvoltage*1000.0f) / (1.0f + 0.0166f * (fThR - 177.0f))) / 3.11f;
//~ }

// -8388608 to 8388607
int ADS1256::ReadOffsetCalibration()
{
	if (!bPresentOnBus) return 0;

    int32_t value = 0;
    uint8_t buf[3] = {0,0,0};

    DEV_gpio_write(ADS1256_CS_PIN, 0);			// cs stays low during the whole command sequence
		DEV_SPI_WriteByte(CMD_RREG | REG_OFC0);	// address of the first register to be read
		DEV_SPI_WriteByte(0x02);				// number of registers to be written minus 1
			DEV_Delay_us(10);					// t6 (50 CLK 7.68MHz)
		buf[0] = DEV_SPI_ReadByte();
		buf[1] = DEV_SPI_ReadByte();
		buf[2] = DEV_SPI_ReadByte();
    DEV_gpio_write(ADS1256_CS_PIN, 1);
    
    value = ((uint32_t)buf[2] << 16) | ((uint32_t)buf[1] << 8) | (uint32_t)buf[0];
    
    if (value & 0x800000)
    {
        // propagate negative complement
        value |= 0xFF000000;
	}
	
	return value;
}


// 0 to 16777215
unsigned int ADS1256::ReadScalingCalibration()
{
   	if (!bPresentOnBus) return 0;
    
    int32_t value = 0;
    uint8_t buf[3] = {0,0,0};

    DEV_gpio_write(ADS1256_CS_PIN, 0);			// cs stays low during the whole command sequence
		DEV_SPI_WriteByte(CMD_RREG | REG_FSC0);	// address of the first register to be read
		DEV_SPI_WriteByte(0x02);				// number of registers to be written minus 1
			DEV_Delay_us(10);					// t6 (50 CLK 7.68MHz)
		buf[0] = DEV_SPI_ReadByte();
		buf[1] = DEV_SPI_ReadByte();
		buf[2] = DEV_SPI_ReadByte();
    DEV_gpio_write(ADS1256_CS_PIN, 1);
    
    value = ((uint32_t)buf[2] << 16) | ((uint32_t)buf[1] << 8) | (uint32_t)buf[0];
    
	return value;
}


void ADS1256::WriteOffsetCalibration(int iOffset)
{
	if (!bPresentOnBus) return;
    
    DEV_gpio_write(ADS1256_CS_PIN, 0);			// cs stays low during the whole command sequence
		DEV_SPI_WriteByte(CMD_WREG | REG_OFC0);	// address of the first register to be written
		DEV_SPI_WriteByte(0x02);				// number of registers to be written minus 1
		
		DEV_SPI_WriteByte(iOffset);
			iOffset = iOffset >> 8;
		DEV_SPI_WriteByte(iOffset);
			iOffset = iOffset >> 8;
		DEV_SPI_WriteByte(iOffset);
    DEV_gpio_write(ADS1256_CS_PIN, 1);

    // wait until auto sampling comes back
    WaitDRDY_();
}


void ADS1256::WriteScalingCalibration(unsigned int iScale)
{
	if (!bPresentOnBus) return;
	
    DEV_gpio_write(ADS1256_CS_PIN, 0);			// cs stays low during the whole command sequence
		DEV_SPI_WriteByte(CMD_WREG | REG_FSC0);	// address of the first register to be written
		DEV_SPI_WriteByte(0x02);				// number of registers to be written minus 1
		
		DEV_SPI_WriteByte(iScale);
			iScale = iScale >> 8;
		DEV_SPI_WriteByte(iScale);
			iScale = iScale >> 8;
		DEV_SPI_WriteByte(iScale);
    DEV_gpio_write(ADS1256_CS_PIN, 1);

    // wait until auto sampling comes back
    WaitDRDY_();
}






