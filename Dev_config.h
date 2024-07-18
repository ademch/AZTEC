
#ifndef DEV_CONFIG_H
#define DEV_CONFIG_H

#include <wiringpi2/wiringPi.h>


void _delayMS(unsigned int ms);

// GPIO read and write
#define DEV_gpio_write(_pin, _value)     digitalWrite(_pin, (_value == 0) ? LOW : HIGH)
#define DEV_gpio_read(_pin)              digitalRead(_pin)

// SPI
#define DEV_SPI_WriteByte(_dat)          SPI_WriteByte(_dat)
#define DEV_SPI_ReadByte()               SPI_ReadByte()

// delays
#define DEV_Delay_ms(__xms)   			 delay(__xms)					// wiringPi internal implementation
#define DEV_Delay_us(__xms)   			 delayMicroseconds(__xms)		// wiringPi internal implementation, val < 100 performs busy wait


uint8_t SPI_ReadByte();
void    SPI_WriteByte(uint8_t value);


#endif
