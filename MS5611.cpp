
#include <math.h>
#include <unistd.h>
#include <stdlib.h>
#include <stdio.h>

#include <fcntl.h>
#include <sys/ioctl.h>
#include <linux/i2c-dev.h>

#include "MS5611.h"


extern void _delayMS(unsigned int ms);

int MS5611::iDev = -1;


MS5611::MS5611(ms5611_osr_t _osr, int _address)
{
    uosr    = _osr;
    address = _address;
    
    bPresentOnBus = false;
}

bool MS5611::IsConnected()
{
	return bPresentOnBus;
}

bool MS5611::openBus()
{
	if ((iDev = open("/dev/i2c-0", O_RDWR)) < 0)
		return -1;

	return (iDev >= 0);
}

void MS5611::closeBus()
{
	if (iDev >= 0) close(iDev);
}


int MS5611::sendReset()
{
	int iRes = sendCommand(MS5611_CMD_RESET);
	
	if (iRes == 0)
		bPresentOnBus = true;
	
	return iRes;
}


void MS5611::readPROMcoefficients()
{
	if (!bPresentOnBus) return;
	
	coef0 = readRegister16(0xA0);
	coef1 = readRegister16(MS5611_CMD_READ_PROM + (0 << 1));
	coef2 = readRegister16(MS5611_CMD_READ_PROM + (1 << 1));
	coef3 = readRegister16(MS5611_CMD_READ_PROM + (2 << 1));
	coef4 = readRegister16(MS5611_CMD_READ_PROM + (3 << 1));
	coef5 = readRegister16(MS5611_CMD_READ_PROM + (4 << 1));
	coef6 = readRegister16(MS5611_CMD_READ_PROM + (5 << 1));
	coef7 = readRegister16(0xAE);
}


unsigned int MS5611::readRawTemperature(void)
{
	if (!bPresentOnBus) return 0;

	// start sampling
	sendCommand(MS5611_CMD_CONV_D2 + uosr);

	// wait for sampling end
    _delayMS(20);

    return readRegister24(MS5611_CMD_ADC_READ);
}



unsigned int MS5611::readRawPressure(void)
{
	if (!bPresentOnBus) return 0;

	// start sampling
	sendCommand(MS5611_CMD_CONV_D1 + uosr);

	// wait for sampling end
    _delayMS(20);

    return readRegister24(MS5611_CMD_ADC_READ);
}


float MS5611::readPressure()
{
	if (!bPresentOnBus) return 0.0f;

    uint32_t D1 = readRawPressure();
    uint32_t D2 = readRawTemperature();	
    
    int32_t dT = D2 - ((uint32_t)coef5 << 8);					// dT = D2 - Tref = D2 - c5 * 2^8
	int32_t TEMP = 2000 + (((int64_t) dT * coef6) >> 23);		// TEMP = 2000 + dT * c6 / 2^23

    int64_t OFF  = ((int64_t)coef2 << 16) + (((int64_t)coef4 * dT) >> 7);	// OFF  = c2 * 2^16 + (c4*dT) / 2^7
    int64_t SENS = ((int64_t)coef1 << 15) + (((int64_t)coef3 * dT) >> 8);	// SENS = c1 * 2^15 + (c3*dT) / 2^8

	int64_t OFF2  = 0;
	int64_t SENS2 = 0;

	if (TEMP < 2000) 	// if temperature is lower than +20 Celsius
	{
		OFF2  = ( 5 * ((TEMP - 2000) * (TEMP - 2000)) ) >> 1;
		SENS2 = ( 5 * ((TEMP - 2000) * (TEMP - 2000)) ) >> 2;
	}

	if (TEMP < -1500) 	// if temperature is lower than -15 Celsius
	{
		OFF2  +=   7 * ((TEMP + 1500) * (TEMP + 1500));
		SENS2 += (11 * ((TEMP + 1500) * (TEMP + 1500)) ) >> 1;
	}

	OFF  = OFF  - OFF2;
	SENS = SENS - SENS2;

    int P = (((D1 * SENS) >> 21) - OFF) >> 15;	// (D1 * SENS / 2^21 - OFF) / 2^15

    return ((float)P/100.0);
}


float MS5611::readTemperature()
{
	if (!bPresentOnBus) return 0.0f;

    uint32_t D2 = readRawTemperature();

    int32_t dT = D2 - ((uint32_t)coef5 << 8);					// dT = D2 - Tref = D2 - c5 * 2^8
    int32_t TEMP = 2000 + (((int64_t)dT * coef6) >> 23);		// TEMP = 2000 + dT * c6 / 2^23

    TEMP2 = 0;
	if (TEMP < 2000) TEMP2 = (dT * dT) >> 31;

    TEMP = TEMP - TEMP2;

    return ((float)TEMP/100.0);
}

// Calculate altitude from Pressure & Sea level pressure
double MS5611::getAltitude(double pressure, double seaLevelPressure)
{
    return (44330.0f * (1.0f - pow(pressure / seaLevelPressure, 0.1902949f)));
}

// Calculate sea level from Pressure given on specific altitude
double MS5611::getSeaLevel(double pressure, double altitude)
{
    return (pressure / pow(1.0f - (altitude / 44330.0f), 5.255f));
}

// Read 16-bit from register (MSB, LSB)
uint16_t MS5611::readRegister16(unsigned char reg)
{
   	// set slave address
    if (ioctl(iDev, I2C_SLAVE, address) < 0)
		return 0;

	// prepare for read
	if (write(iDev, &reg, 1) != 1)
	{
		printf("Failed to write to the i2c bus\n");
		return 0;
	}
    
    // read 2 byte value
    unsigned char buf[2];
	if (read(iDev, buf, 2) != 2)
	{
		printf("Failed to read from the i2c bus\n");
		return 0;
	}
	
	return ((uint16_t)buf[0] << 8) | buf[1];
}


// Read 24-bit from register (XSB, MSB, LSB)
uint32_t MS5611::readRegister24(unsigned char reg)
{
  	// set slave address
    if (ioctl(iDev, I2C_SLAVE, address) < 0)
		return 0;

	// prepare for read
	if (write(iDev, &reg, 1) != 1)
	{
		printf("Failed to write to the i2c 0x%02x device\n", address);
		return 0;
	}
    
    // read 3 byte value
    unsigned char buf[3];
	if (read(iDev, buf, 3) != 3)
	{
		printf("Failed to read from the i2c 0x%02x device\n", address);
		return 0;
	}
	
	return ((uint32_t)buf[0] << 16) | ((uint32_t)buf[1] << 8) | buf[2];
}


int MS5611::sendCommand(unsigned char reg)
{
  	// set slave address
    if (ioctl(iDev, I2C_SLAVE, address) < 0)
		return -1;

	if (write(iDev, &reg, 1) != 1)
	{
		printf("Failed to write to the i2c 0x%02x device\n", address);
		return -1;
	}

	return 0;
}
