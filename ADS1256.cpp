
#include "ADS1256.h"
#include "Dev_config.h"

#include <unistd.h>
#include <linux/spi/spidev.h>
#include <wiringpi2/wiringPiSPI.h>



ADS1256::ADS1256()
{
    bPresentOnBus = false;
}


int ADS1256::PinConfigStart()
{
    // Step 1 Setup pin numbering table---------------------------------

    if (wiringPiSetup() < 0)			// use wiringpi Pin numbering table
    //if (wiringPiSetupGpio() < 0)		// use BCM2835 Pin number table
    { 	
        printf("wiringPi setup failed\n");
        return 1;
    }
    else {
        printf("wiringPi setup successful\n");
    }

    // Step 2: pins config----------------------------------------------

    pinMode(ADS1256_RST_PIN,       	OUTPUT);	// defaults to INPUT pullup
    pinMode(ADS1256_SYNC_PDWN_PIN, 	OUTPUT);	// defaults to INPUT pulldown, making the device to powerdown after 20 DRDY periods
    pinMode(ADS1256_CS_PIN,        	OUTPUT);	// defaults to INPUT pullup
    pinMode(ADS1256_DRDY_PIN,      	INPUT);		// defaults to INPUT pullup
    pinMode(DAC8552_CS_PIN,        	OUTPUT);	// defaults to INPUT pullup

   	pullUpDnControl(ADS1256_DRDY_PIN,   PUD_DOWN);	// pull down in order WaitDRADY to return when DEVICE is not connected

   	DEV_gpio_write(ADS1256_RST_PIN,       1);
   	DEV_gpio_write(ADS1256_CS_PIN,        1);
   	DEV_gpio_write(DAC8552_CS_PIN,        1);

    //~ pinMode(ADS1256_MOSI,    		OUTPUT);
    //~ pinMode(ADS1256_MISO,    		INPUT);
    //~ pinMode(ADS1256_CLK,    		OUTPUT);

   	//~ DEV_gpio_write(ADS1256_MOSI,		  0);
   	//~ DEV_gpio_write(ADS1256_CLK,           0);
   	
   	//~ pullUpDnControl(ADS1256_MISO, PUD_UP);

    // Step 3: SPI init-------------------------------------------------

	// channel: (odroid has only one 0 channel)
	// speedHZ: 2MHz, , but gave errors
	// SPI mode: 1
	wiringPiSPISetupMode(0, 2000000, SPI_MODE_1);
	//fdSPI = _wiringPiSPISetup();
	
    return 0;
}


void ADS1256::PinConfigExit()
{
	DEV_gpio_write(ADS1256_RST_PIN, 1);
   	DEV_gpio_write(ADS1256_CS_PIN,  1);
   	DEV_gpio_write(DAC8552_CS_PIN,  1);
   	
   	pinMode(ADS1256_RST_PIN,   		INPUT);
    pinMode(ADS1256_SYNC_PDWN_PIN,  INPUT);
    pinMode(ADS1256_CS_PIN,         INPUT);
    pinMode(ADS1256_DRDY_PIN,  		INPUT);
    pinMode(DAC8552_CS_PIN,    		INPUT);
    
    // power down ADS
    pullUpDnControl(ADS1256_SYNC_PDWN_PIN, PUD_DOWN);
    
    
    //~ pinMode(ADS1256_MOSI,          INPUT);
    //~ // pinMode(ADS1256_MISO,       INPUT);
    //~ pinMode(ADS1256_CLK,           INPUT);
}



uint8_t ADS1256::Init()
{
	// ODROID spi bus starts uninitialized- CLK and MOSI lines are held high
	// This dummy read leaves lines at zero level
	DEV_SPI_ReadByte();
	
	PowerOn();
	
    Reset();
    
    // SPI protocol has no hardware aknowledge
    if(ReadChipID() == 3)
    {
        printf("ADS1256 ID Read success\n");
        bPresentOnBus = true;
	}
    else
    {
        printf("ADS1256 ID Read failed\n");
        //return 1;
    }
    
    return 0;
}


// p.27 After reset calibartion registers are initialized to their default state
//      After reset release self-calibartion is performed
void ADS1256::Reset()
{
    DEV_gpio_write(ADS1256_RST_PIN, 0);
    	DEV_Delay_ms(20);
    DEV_gpio_write(ADS1256_RST_PIN, 1);
        DEV_Delay_ms(20);

	// wait until auto sampling comes back
	WaitDRDY();
}


void ADS1256::SelfCalibrate()
{
	// wait for nice opportunity
	WaitDRDY();
	
	WriteCmd(CMD_SELFCAL);
	
	// wait until auto sampling comes back
	WaitDRDY();
}

// p.27 To exit power-down take the SYNC_PDWN high
//      Crystal oscillator typically requires 30ms to wake up
void ADS1256::PowerOn()
{
   	DEV_gpio_write(ADS1256_SYNC_PDWN_PIN, 1);
        DEV_Delay_ms(30);

	// wait for auto sampling comes back
	WaitDRDY();
}

// p.27 Toggle SYNC_PDWN pin low to restart conversion
//      reflecting changed parameters
void ADS1256::Sync()
{
   	DEV_gpio_write(ADS1256_SYNC_PDWN_PIN, 0);
        DEV_Delay_us(30);
   	DEV_gpio_write(ADS1256_SYNC_PDWN_PIN, 1);
}

// Send a single byte command
void ADS1256::WriteCmd(uint8_t cmd)
{
    DEV_gpio_write(ADS1256_CS_PIN, 0);
		DEV_SPI_WriteByte(cmd);
    DEV_gpio_write(ADS1256_CS_PIN, 1);
}

// Write the data to a destination register
void ADS1256::WriteReg(uint8_t reg, uint8_t data)
{
    DEV_gpio_write(ADS1256_CS_PIN, 0);		// cs stays low during the whole command sequence
		DEV_SPI_WriteByte(CMD_WREG | reg);	// address of the first reigster to be written
		DEV_SPI_WriteByte(0x00);			// number of registers to be written minus 1
		DEV_SPI_WriteByte(data);
    DEV_gpio_write(ADS1256_CS_PIN, 1);
}

// Read a data from the destination register
uint8_t ADS1256::ReadReg(uint8_t reg)
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
void ADS1256::WaitDRDY()
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
uint8_t ADS1256::ReadChipID()
{
    uint8_t id = ReadReg(REG_STATUS);
    
    printf("ReadReg: %d\n", id);
    
    return id >> 4;
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

    DEV_gpio_write(ADS1256_CS_PIN, 0);		// cs stays low during the whole command sequence
		DEV_SPI_WriteByte(CMD_WREG | 0);	// address of the first register to be written
		DEV_SPI_WriteByte(0x03);			// number of registers to be written minus 1
		
		DEV_SPI_WriteByte(registers[0]);
		DEV_SPI_WriteByte(registers[1]);
		DEV_SPI_WriteByte(registers[2]);
		DEV_SPI_WriteByte(registers[3]);
    DEV_gpio_write(ADS1256_CS_PIN, 1);

    // wait until auto sampling comes back
    WaitDRDY();
}


void ADS1256::ConfigInputMultiplexer(uint8_t uiPos, uint8_t uiNeg)
{
    WriteReg(REG_MUX, uiPos | uiNeg);
}

void ADS1256::ConfigInputMultiplexer(uint8_t uiPosNeg)
{
    WriteReg(REG_MUX, uiPosNeg);
} 


float ADS1256::Read_ADCdata()
{
    int32_t value = 0;
    uint8_t buf[3] = {0,0,0};
    
    WaitDRDY();
    
    DEV_gpio_write(ADS1256_CS_PIN, 0);
		DEV_SPI_WriteByte(CMD_RDATA);
		DEV_Delay_us(10);					// t6 (50 CLK 7.68MHz)
		buf[0] = DEV_SPI_ReadByte();
		buf[1] = DEV_SPI_ReadByte();
		buf[2] = DEV_SPI_ReadByte();
    DEV_gpio_write(ADS1256_CS_PIN, 1);
    
    value = ((uint32_t)buf[0] << 16) | ((uint32_t)buf[1] << 8) | buf[2];
    
    if (value & 0x800000)
    {
        // propagate negative complement
        value |= 0xFF000000;
	}
	
	float fValue = value;
	float fMax = 0x7FFFFF;
    
    //     5v max for PGA=1
    return 2.0f*2.5f*fValue/fMax;
}

// 
float ADS1256::GetChannelValue(uint8_t uiPosNeg)
{
    if (!bPresentOnBus) return 0.0f;
    
	time_t rawtime;
	time(&rawtime);
	
	printf("\n%s", ctime(&rawtime));

	ConfigInputMultiplexer(uiPosNeg);

    // wait for nice communication opportunity
    WaitDRDY();
	
	Sync();
	
	return Read_ADCdata();
}


float ADS1256::GetThermocoupleVoltage()
{
    if (!bPresentOnBus) return 0.0f;

	return GetChannelValue(ADS1256_AIN3P_AINCOMN);
}



float ADS1256::GetThermistorVoltage()
{
    if (!bPresentOnBus) return 0.0f;

	return GetChannelValue(ADS1256_AIN2P_AINCOMN);
}


float ADS1256::GetThermistorResistance()
{
    if (!bPresentOnBus) return 0.0f;
    
	float fVoltage = GetThermistorVoltage();
	
	// (Uref - U)    Rref
	// ----------- = ----   =>
	//      U         Rx
	
	// Rx = (Rref * U) / (Uref - U)
	
	return fVoltage * ETALON_RESISTANCE / (REF_VOLTAGE - fVoltage);
}

// Returns ThC and ThR values to sample once
// Do not use, client calculates by itself !!
float ADS1256::GetFlux(float& fThCvoltage, float& fThR)
{
    if (!bPresentOnBus) return 0.0f;
    
	fThCvoltage = GetThermocoupleVoltage();
	fThR        = GetThermistorResistance();
	
	return ( (fThCvoltage*1000.0f) / (1.0f + 0.0166f * (fThR - 177.0f))) / 3.11f;
}

// -8388608 to 8388607
int ADS1256::ReadOffsetCalibration()
{
	if (!bPresentOnBus) return 0;

    int32_t value = 0;
    uint8_t buf[3] = {0,0,0};

    DEV_gpio_write(ADS1256_CS_PIN, 0);		// cs stays low during the whole command sequence
		DEV_SPI_WriteByte(CMD_RREG | 5);	// address of the first register to be written
		DEV_SPI_WriteByte(0x02);			// number of registers to be written minus 1
			DEV_Delay_us(10);				// t6 (50 CLK 7.68MHz)
		buf[2] = DEV_SPI_ReadByte();
		buf[1] = DEV_SPI_ReadByte();
		buf[0] = DEV_SPI_ReadByte();
    DEV_gpio_write(ADS1256_CS_PIN, 1);
    
    value = ((uint32_t)buf[0] << 16) | ((uint32_t)buf[1] << 8) | buf[2];
    
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

    DEV_gpio_write(ADS1256_CS_PIN, 0);		// cs stays low during the whole command sequence
		DEV_SPI_WriteByte(CMD_RREG | 8);	// address of the first register to be written
		DEV_SPI_WriteByte(0x02);			// number of registers to be written minus 1
			DEV_Delay_us(10);				// t6 (50 CLK 7.68MHz)
		buf[2] = DEV_SPI_ReadByte();
		buf[1] = DEV_SPI_ReadByte();
		buf[0] = DEV_SPI_ReadByte();
    DEV_gpio_write(ADS1256_CS_PIN, 1);
    
    value = ((uint32_t)buf[0] << 16) | ((uint32_t)buf[1] << 8) | buf[2];
    
	return value;
}


void ADS1256::WriteOffsetCalibration(int iOffset)
{
	if (!bPresentOnBus) return;
    
    DEV_gpio_write(ADS1256_CS_PIN, 0);		// cs stays low during the whole command sequence
		DEV_SPI_WriteByte(CMD_WREG | 5);	// address of the first register to be written
		DEV_SPI_WriteByte(0x02);			// number of registers to be written minus 1
		
		DEV_SPI_WriteByte(iOffset);
			iOffset = iOffset >> 8;
		DEV_SPI_WriteByte(iOffset);
			iOffset = iOffset >> 8;
		DEV_SPI_WriteByte(iOffset);
    DEV_gpio_write(ADS1256_CS_PIN, 1);

    // wait until auto sampling comes back
    WaitDRDY();
}


void ADS1256::WriteScalingCalibration(unsigned int iScale)
{
	if (!bPresentOnBus) return;
	
    DEV_gpio_write(ADS1256_CS_PIN, 0);		// cs stays low during the whole command sequence
		DEV_SPI_WriteByte(CMD_WREG | 8);	// address of the first register to be written
		DEV_SPI_WriteByte(0x02);			// number of registers to be written minus 1
		
		DEV_SPI_WriteByte(iScale);
			iScale = iScale >> 8;
		DEV_SPI_WriteByte(iScale);
			iScale = iScale >> 8;
		DEV_SPI_WriteByte(iScale);
    DEV_gpio_write(ADS1256_CS_PIN, 1);

    // wait until auto sampling comes back
    WaitDRDY();
}






