

#include <unistd.h>

#include "Dev_config.h"
#include "ADS1256.h"

#include <wiringpi2/wiringPiSPI.h>
#include <linux/spi/spi.h>

#include <fcntl.h>
#include <sys/ioctl.h>


void _delayMS(unsigned int ms)
{
	usleep(ms*1000);
}


uint8_t SPI_ReadByte()
{
    int read_data;
    uint8_t tx_rxBuffer = 0xff;	// dummy byte (sending takes place at the same time as receiving)
    
    read_data = wiringPiSPIDataRW(0, &tx_rxBuffer, 1);
    if (read_data < 0)
        perror("wiringPiSPIDataRW failed\n");
        
    return tx_rxBuffer;
    
    // read 2 byte value
    //~ unsigned char buf[2] = {0xFF, 0xFF};
	//~ if (read(fdSPI, buf, 1) != 1)
	//~ {
		//~ printf("Failed to read from spi bus\n");
		//~ return 0;
	//~ }
	
	//~ return buf[0];
	
	//~ uint8_t value = 0;
	//~ uint8_t bitSlider = 0b10000000;
	//~ for (int i=0; i<8; i++)
	//~ {
		//~ DEV_gpio_write(ADS1256_CLK, 1);
		
		//~ for (unsigned int l=0; l < 10000; l++)
			//~ asm volatile("nop \n nop \n nop");

		//~ DEV_gpio_write(ADS1256_CLK, 0);
		
		//~ if (DEV_gpio_read(ADS1256_MISO))
			//~ value |= bitSlider;

		//~ for (unsigned int l=0; l < 10000; l++)
			//~ asm volatile("nop \n nop \n nop");

		//~ DEV_gpio_write(ADS1256_MOSI, 0);

		//~ for (unsigned int l=0; l < 10000; l++)
			//~ asm volatile("nop \n nop \n nop");
		
		//~ bitSlider = bitSlider >> 1;
	//~ }
	
	//~ return value;
}


void SPI_WriteByte(uint8_t value)
{
    int read_data;
    
    read_data = wiringPiSPIDataRW(0, &value, 1);
    if (read_data < 0)
        perror("wiringPiSPIDataRW failed\n");
        
	//~ if (write(fdSPI, &value, 1) != 1)
	//~ {
		//~ printf("Failed to write to spi bus\n");
	//~ }
	
	
	//~ for (int i=0; i<8; i++)
	//~ {
		//~ DEV_gpio_write(ADS1256_CLK, 1);
		
		//~ if (value & 0b10000000)
			//~ DEV_gpio_write(ADS1256_MOSI, 1);
		//~ else
			//~ DEV_gpio_write(ADS1256_MOSI, 0);
			
		//~ for (unsigned int l=0; l < 10000; l++)
			//~ asm volatile("nop \n nop \n nop");

		//~ DEV_gpio_write(ADS1256_CLK, 0);

		//~ for (unsigned int l=0; l < 10000; l++)
			//~ asm volatile("nop \n nop \n nop");

		//~ DEV_gpio_write(ADS1256_MOSI, 0);

		//~ for (unsigned int l=0; l < 10000; l++)
			//~ asm volatile("nop \n nop \n nop");
		
		//~ value = value << 1;
	//~ }
}





