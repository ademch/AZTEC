
#ifndef MS5611_h
#define MS5611_h

#include <stdint.h>

                                            //             ___
#define MS5611_ADDRESS_1              0x77  // 1 1 1 0 1 1 CSB
                                            //             ___
#define MS5611_ADDRESS_2              0x76  // 1 1 1 0 1 1 CSB

#define MS5611_CMD_ADC_READ           0x00
#define MS5611_CMD_RESET              0x1E
#define MS5611_CMD_CONV_D1            0x40	// pressure
#define MS5611_CMD_CONV_D2            0x50	// temperature
#define MS5611_CMD_READ_PROM          0xA2


typedef enum
{
    MS5611_SAMPLES_4096     = 0x08,
    MS5611_SAMPLES_2048     = 0x06,
    MS5611_SAMPLES_1024     = 0x04,
    MS5611_SAMPLES_512      = 0x02,
    MS5611_SAMPLES_256      = 0x00
    
} ms5611_osr_t;


class MS5611
{
public:

	MS5611(ms5611_osr_t osr, int _address);
	
	static bool openBus();
	static void closeBus();
	
 	unsigned int readRawTemperature(void);
	unsigned int readRawPressure(void);
	
	float readTemperature();
	float readPressure();
	
	double getAltitude(double pressure, double seaLevelPressure = 101325);
	double getSeaLevel(double pressure, double altitude);

	int sendReset();
	void readPROMcoefficients();
	
	bool IsConnected();

private:

	static int iDev;
    
    int address;

	unsigned char uosr;
	bool bPresentOnBus;
	
	uint16_t coef0, coef7;
	uint16_t coef1, coef2, coef3, coef4, coef5, coef6;

	int TEMP2;
	long long int OFF2, SENS2;
	
	uint16_t readRegister16_(unsigned char reg);
	uint32_t readRegister24_(unsigned char reg);
	int      sendCommand_(unsigned char reg);
};

#endif
