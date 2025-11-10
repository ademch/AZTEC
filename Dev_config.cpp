

#include <unistd.h>

#include "Dev_config.h"
#include "ADS1256.h"
#include "DAC8552.h"

#include <wiringpi2/wiringPiSPI.h>
#include <linux/spi/spi.h>

#include <fcntl.h>
#include <sys/ioctl.h>


void _delayMS(unsigned int ms)
{
	usleep(ms*1000);
}



int PinConfigStart()
{
    // Step 1: Setup pin numbering table---------------------------------

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
    pinMode(ADS1256_SYNC_PDWN_PIN, 	OUTPUT);	// defaults to INPUT pulldown on ODROID, making the device to powerdown after 20 DRDY periods
    pinMode(ADS1256_CS_PIN,        	OUTPUT);	// defaults to INPUT pullup
    pinMode(ADS1256_DRDY_PIN,      	INPUT);		// defaults to INPUT pullup
    
    pinMode(DAC8552_CS_PIN,        	OUTPUT);	// defaults to INPUT pullup

   	pullUpDnControl(ADS1256_DRDY_PIN,   PUD_DOWN);	// pull down in order WaitDRDY to return when DEVICE is not connected

   	DEV_gpio_write(ADS1256_RST_PIN,       1);
   	DEV_gpio_write(ADS1256_CS_PIN,        1);
   	
    DEV_gpio_write(DAC8552_CS_PIN,        1);

    // Configured by KERNEL
    /*
    pinMode(ADS1256_MOSI,    		OUTPUT);
    pinMode(ADS1256_MISO,    		INPUT);
    pinMode(ADS1256_CLK,    		OUTPUT);

   	DEV_gpio_write(ADS1256_MOSI,		  0);
   	DEV_gpio_write(ADS1256_CLK,           0);
   	
   	pullUpDnControl(ADS1256_MISO, PUD_UP);
    */

    // Step 3: SPI init-------------------------------------------------

	// channel: (odroid has only one 0 channel)
	// speedHZ: 2MHz, , but gave errors
	// SPI mode: 1
	wiringPiSPISetupMode(0, 2000000, SPI_MODE_1);
	//fdSPI = _wiringPiSPISetup();
	
    return 0;
}


void PinConfigExit()
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
    
    // Configured by KERNEL
    /* 
    pinMode(ADS1256_MOSI,          INPUT);
    // pinMode(ADS1256_MISO,       INPUT);
    pinMode(ADS1256_CLK,           INPUT);
    */
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





