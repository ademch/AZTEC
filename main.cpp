
#include <stdlib.h>
#include <stdio.h>
#include <unistd.h>

#include "MS5611.h"
#include "Dev_config.h"
#include "ADS1256.h"

#include "HTTP_Server.h"

#include <signal.h>


using namespace std;


MS5611 ms5611(MS5611_SAMPLES_4096);
ADS1256 ads1256;


void sigintHandler(int s)
{
    printf("Caught signal %d\n", s);
    
   	ads1256.PinConfigExit();

    exit(1); 
}


int main(int argc, char *argv[])
{
	signal(SIGINT, sigintHandler);
	
	ads1256.PinConfigStart();
	
	ads1256.Init();
	
	ads1256.ConfigADC(ADS1256_GAIN_1, ADS1256_25SPS);
	

	//~ int iOffsetCoef = ads1256.ReadOffsetCalibration();
	//~ printf("Calibration offset coefficient: %d\n", iOffsetCoef);

	//~ int iScaleCoef = ads1256.ReadScalingCalibration();
	//~ printf("Calibration scale coefficient: %d\n", iScaleCoef);
	
			//~ ads1256.SelfCalibrate();
			
	//~ iOffsetCoef = ads1256.ReadOffsetCalibration();
	//~ printf("Calibration offset coefficient: %d\n", iOffsetCoef);

	//~ iScaleCoef = ads1256.ReadScalingCalibration();
	//~ printf("Calibration scale coefficient: %d\n", iScaleCoef);
	
			
	// Calibration values acquired from physical calibration
	ads1256.WriteOffsetCalibration(-803);
	ads1256.WriteScalingCalibration(3855000);	 // vs 3863056 factory
			
	int iOffsetCoef = ads1256.ReadOffsetCalibration();
	printf("Calibration offset coefficient: %d\n", iOffsetCoef);

	int iScaleCoef = ads1256.ReadScalingCalibration();
	printf("Calibration scale coefficient: %d\n", iScaleCoef);
			

	//~ while(1)
	//~ {
		//~ float fValue;
		//~ fValue = ads1256.GetChannelValue(ADS1256_AIN2P_AINCOMN);
		//~ printf("ADC%d value %fv\n", 2, fValue);
	

			
		//~ fValue = ads1256.GetChannelValue(ADS1256_AIN3P_AINCOMN);
		//~ printf("ADC%d value %fv\n", 3, fValue);
		
		//~ delayMicroseconds(1000000);
	//~ }
		
    printf("\n\n");
	
    // Open I2C bus
    if (!ms5611.openBus())
        printf("Failed to open I2C bus\n");
    else
		printf("I2C bus opened successfully\n");
    
	_delayMS(10);
    
	if (ms5611.sendReset() < 0)
		printf("Device 0x%X did not respond\n", MS5611_ADDRESS);
	else
		printf("MS5611 reset successfully\n");
	
    _delayMS(100);

    ms5611.readPROMcoefficients();
    
    float fTemp = ms5611.readTemperature();
    printf("Temperature %f C\n", fTemp);

    float fPressure = ms5611.readPressure();
    printf("Pressure %f mBar\n", fPressure);
    
    CreateHTTPserver(&ms5611, &ads1256);
    
    return 0;
}


