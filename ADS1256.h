#ifndef ADS1256_H
#define ADS1256_H

#include <stdint.h>


// channel gain
typedef enum
{
	ADS1256_GAIN_1			= 0,
	ADS1256_GAIN_2			= 1,
	ADS1256_GAIN_4			= 2,
	ADS1256_GAIN_8			= 3,
	ADS1256_GAIN_16			= 4,
	ADS1256_GAIN_32			= 5,
	ADS1256_GAIN_64			= 6
	
} ADS1256_GAIN;


#define ADS1256_30000SPS  0xF0
#define ADS1256_15000SPS  0xE0
#define ADS1256_7500SPS   0xD0
#define ADS1256_3750SPS   0xC0
#define ADS1256_2000SPS   0xB0
#define ADS1256_1000SPS   0xA1
#define ADS1256_500SPS    0x92
#define ADS1256_100SPS    0x82
#define ADS1256_60SPS     0x72
#define ADS1256_50SPS     0x63
#define ADS1256_30SPS     0x53
#define ADS1256_25SPS     0x43
#define ADS1256_15SPS     0x33
#define ADS1256_10SPS     0x23
#define ADS1256_5SPS      0x13
#define ADS1256_2d5SPS    0x03


#define ADS1256_AIN0_N    0b00000000
#define ADS1256_AIN1_N    0b00000001
#define ADS1256_AIN2_N    0b00000010
#define ADS1256_AIN3_N    0b00000011
#define ADS1256_AIN4_N    0b00000100
#define ADS1256_AIN5_N    0b00000101
#define ADS1256_AIN6_N    0b00000110
#define ADS1256_AIN7_N    0b00000111
#define ADS1256_AINCOM_N  0b00001000

#define ADS1256_AIN0_P    0b00000000
#define ADS1256_AIN1_P    0b00010000
#define ADS1256_AIN2_P    0b00100000
#define ADS1256_AIN3_P    0b00110000
#define ADS1256_AIN4_P    0b01000000
#define ADS1256_AIN5_P    0b01010000
#define ADS1256_AIN6_P    0b01100000
#define ADS1256_AIN7_P    0b01110000
#define ADS1256_AINCOM_P  0b10000000

// Thermoresistor voltage
#define ADS1256_AIN_THERMISTOR_V   			(ADS1256_AIN7_N | ADS1256_AIN6_P)

// Thermoresistor leg R2
#define ADS1256_AIN_THERMISTOR_MINUS_V 		(ADS1256_AINCOM_N | ADS1256_AIN7_P)

// Thermoresistor leg R1
#define ADS1256_AIN_THERMISTOR_PLUS_V 		(ADS1256_AINCOM_N | ADS1256_AIN6_P)


// Thermocouple voltage
#define ADS1256_AIN_THERMOCOUPLE_V 			(ADS1256_AIN4_N | ADS1256_AIN5_P)

// Thermocouple leg B-
#define ADS1256_AIN_THERMOCOUPLE_MINUS_V 	(ADS1256_AINCOM_N | ADS1256_AIN4_P)

// Thermocouple leg B+
#define ADS1256_AIN_THERMOCOUPLE_PLUS_V 	(ADS1256_AINCOM_N | ADS1256_AIN5_P)


// Ref 3.0 voltage
#define ADS1256_AIN_REF30_V		   			(ADS1256_AINCOM_N | ADS1256_AIN3_P)

typedef enum
{
	//           address       reset default values
	REG_STATUS = 0,	 		// x1H
	REG_MUX    = 1,  		// 01H
	REG_ADCON  = 2,  		// 20H
	REG_DRATE  = 3,  		// F0H
	REG_IO     = 4,  		// E0H
	REG_OFC0   = 5,  		// xxH
	REG_OFC1   = 6,  		// xxH
	REG_OFC2   = 7,  		// xxH
	REG_FSC0   = 8,  		// xxH
	REG_FSC1   = 9,  		// xxH
	REG_FSC2   = 10 		// xxH
	
} ADS1256_REG;


typedef enum
{
	                    // Description                           1st command byte    2nd command byte
	CMD_WAKEUP  = 0x00,	// Completes SYNC and Exits Standby Mode 0000 0000 (00h)
	CMD_RDATA   = 0x01, // Read Data                             0000 0001 (01h)
	CMD_RDATAC  = 0x03, // Read Data Continuously                0000 0011 (03h)
	CMD_SDATAC  = 0x0F, // Stop Read Data Continuously           0000 1111 (0Fh)
	CMD_RREG    = 0x10, // Read from REG rrr                     0001 rrrr (1xh)     0000 nnnn
	CMD_WREG    = 0x50, // Write to REG rrr                      0101 rrrr (5xh)     0000 nnnn
	CMD_SELFCAL = 0xF0, // Offset and Gain Self-Calibration      1111 0000 (F0h)
	CMD_SELFOCAL= 0xF1, // Offset Self-Calibration               1111 0001 (F1h)
	CMD_SELFGCAL= 0xF2, // Gain Self-Calibration                 1111 0010 (F2h)
	CMD_SYSOCAL = 0xF3, // System Offset Calibration             1111 0011 (F3h)
	CMD_SYSGCAL = 0xF4, // System Gain Calibration               1111 0100 (F4h)
	CMD_SYNC    = 0xFC, // Synchronize the A/D Conversion        1111 1100 (FCh)
	CMD_STANDBY = 0xFD, // Begin Standby Mode                    1111 1101 (FDh)
	CMD_RESET   = 0xFE, // Reset to Power-Up Values              1111 1110 (FEh)
	
} ADS1256_CMD;



// GPIO config
#define ADS1256_DRDY_PIN    	0 	// P0 (bcm17)
#define ADS1256_RST_PIN     	1   // P1 (bcm18)
#define ADS1256_SYNC_PDWN_PIN   7	// P7 (bcm22)
#define ADS1256_CS_PIN      	3	// P3 (bcm22)

#define ADS1256_MOSI          	12
#define ADS1256_MISO          	13
#define ADS1256_CLK          	14

// ORDER
#define ORDER_ABUFFER_DIS   	0			// default
#define ORDER_ABUFFER_EN    	(1 << 1)

#define ORDER_AUTO_CAL_DIS  	0			// default
#define ORDER_AUTO_CAL_EN   	(1 << 2)

#define ORDER_MSB_FIRST     	0			// default
#define ORDER_LSB_FIRST     	(1 << 3)

// ADCON
#define ADCON_CLK_OFF       	0
#define ADCON_SENS_DTCT_OFF 	0



class ADS1256
{
public:

	ADS1256();

	uint8_t Init();

	void ConfigADC(ADS1256_GAIN gain, uint8_t drate);

	float GetChannelValue(uint8_t uiPosNeg);
	
	float GetThermistorResistance();
	
	//float GetFlux(float& fThCvoltage, float& fThR);
	
	void SelfCalibrate();
	
	unsigned int ReadScalingCalibration();
	int ReadOffsetCalibration();
	
	void WriteOffsetCalibration(int iOffset);
	void WriteScalingCalibration(unsigned int iScale);
    
    bool IsConnected();

private:

	bool bPresentOnBus;
	
	ADS1256_GAIN m_gain;
	
	uint8_t ReadChipID_();
	void WaitDRDY_();
	
	void Reset_();
	void PowerOn_();
	void Sync_();
	
	void WriteCmd_(uint8_t cmd);
	void WriteReg_(uint8_t reg, uint8_t data);
	uint8_t ReadReg_(uint8_t reg);

	void ConfigInputMultiplexer_(uint8_t uiPosNeg);
	
	float Read_ADCdata_();

};

#endif
