
#include <stdlib.h>
#include <stdio.h>
#include <unistd.h>

#include "MS5611.h"
#include "Dev_config.h"
#include "ADS1256.h"
#include "DAC8552.h"

#include "HTTP_Server.h"

#include <signal.h>

#include <math.h>


using namespace std;

MS5611  ms5611_1(MS5611_SAMPLES_4096, MS5611_ADDRESS_1);
MS5611  ms5611_2(MS5611_SAMPLES_4096, MS5611_ADDRESS_2);
ADS1256 ads1256;
DAC8552 dac8552;


extern bool bTerminateThread;
extern int connectionSocket;

pthread_t thread;
void* samplingThreadFunc(void* ptr);


void sigintHandler(int s)
{
    printf("Caught signal %d\n", s);
    
   	PinConfigExit();
    
    MS5611::closeBus();
    
    bTerminateThread = true;
    pthread_join(thread, NULL);
    
    if (connectionSocket != -1)
        close(connectionSocket);

    // exit is issued by accept in HTTP_Server
}


int main(int argc, char *argv[])
{
	signal(SIGINT, sigintHandler);
	
	PinConfigStart();
	
    printf("\n* Initializing ADS1256...\n");
            
        ads1256.Init();
        
        ads1256.ConfigADC(ADS1256_GAIN_1, ADS1256_25SPS);
        

        //~ int iOffsetCoef = ads1256.ReadOffsetCalibration();
        //~ printf("Calibration offset coefficient: %d\n", iOffsetCoef);

        //~ int iScaleCoef = ads1256.ReadScalingCalibration();
        //~ printf("Calibration scale coefficient: %d\n", iScaleCoef);
        
        ads1256.SelfCalibrate();
                
        //~ iOffsetCoef = ads1256.ReadOffsetCalibration();
        //~ printf("Calibration offset coefficient: %d\n", iOffsetCoef);

        //~ iScaleCoef = ads1256.ReadScalingCalibration();
        //~ printf("Calibration scale coefficient: %d\n", iScaleCoef);
        
        // 1. Measure 0 volts to get offset
        // 2. Measure 3v to get scale
        // Calibration values acquired from physical calibration
        ads1256.WriteOffsetCalibration(-809);
        ads1256.WriteScalingCalibration(3844200);	 // recent 3843750 // vs 3863056 factory // FLuke 3855000
                
        int iOffsetCoef = ads1256.ReadOffsetCalibration();
        if (iOffsetCoef != 0) printf("Calibration offset coefficient: %d\n", iOffsetCoef);

        int iScaleCoef = ads1256.ReadScalingCalibration();
        if (iScaleCoef != 0) printf("Calibration scale coefficient: %d\n", iScaleCoef);
        
        
        // while(1)
        // {
        //	float fValue;
        //		
        //	fValue = ads1256.GetChannelValue(ADS1256_AIN4P_AINCOMN);
        //	printf("ADC%d value %fv\n", 3, fValue);
            
        //	delayMicroseconds(1000000);
        //}
        
        float fV = ads1256.GetChannelValue(ADS1256_AIN_REF30_V);
        printf("Reference voltage: %5.3fv\n", fV);

 
    printf("\n* Initializing DAC8552...\n");

		dac8552.Init(true);
		
		dac8552.SetChA_Voltage(1.5f);

		float fVoltage;
		fVoltage = ads1256.GetChannelValue(ADS1256_AIN_THERMOCOUPLE_MINUS_V);
		printf("Thermocouple B- voltage: %fv\n", fVoltage);

		fVoltage = ads1256.GetChannelValue(ADS1256_AIN_THERMOCOUPLE_PLUS_V);
		printf("Thermocouple B+ voltage: %fv\n", fVoltage);

		fVoltage = ads1256.GetChannelValue(ADS1256_AIN_THERMOCOUPLE_V);
		printf("Thermocouple voltage: %fv\n", fVoltage);
		
		fVoltage = ads1256.GetChannelValue(ADS1256_AIN_THERMISTOR_MINUS_V);
		printf("Thermistor minus voltage: %fv\n", fVoltage);

		fVoltage = ads1256.GetChannelValue(ADS1256_AIN_THERMISTOR_PLUS_V);
		printf("Thermistor plus voltage: %fv\n", fVoltage);

		fVoltage = ads1256.GetChannelValue(ADS1256_AIN_THERMISTOR_V);
		printf("Thermistor voltage: %fv\n", fVoltage);
		
		fVoltage = ads1256.GetChannelValue(ADS1256_AIN_REF30_V);
		printf("Ref 3v: %fv\n", fVoltage);
        
        //return 0;
    
    
    printf("\n* Initializing MS5611...\n");
	
    // Open I2C bus
    if (!MS5611::openBus())
        printf("Failed to open I2C bus\n");
    else
		printf("I2C bus opened successfully\n");
    
_delayMS(100);
    
    float fTemp, fPressure;
    
	if (ms5611_1.sendReset() < 0)
		printf("MS5611 0x%X did not respond\n", MS5611_ADDRESS_1);
	else
		printf("MS5611 0x%X reset successfully\n", MS5611_ADDRESS_1);
	
_delayMS(100);

    ms5611_1.readPROMcoefficients();
    
    fTemp = ms5611_1.readTemperature();
    if (fTemp > 0) printf("    Temperature %f C\n", fTemp);

    fPressure = ms5611_1.readPressure();
    if (fPressure > 0) printf("    Pressure %f mBar\n", fPressure);
    
_delayMS(100);
    
	if (ms5611_2.sendReset() < 0)
		printf("MS5611 0x%X did not respond\n", MS5611_ADDRESS_2);
	else
		printf("MS5611 0x%X reset successfully\n", MS5611_ADDRESS_2);
	
_delayMS(100);

    ms5611_2.readPROMcoefficients();
    
    fTemp = ms5611_2.readTemperature();
    if (fTemp > 0) printf("    Temperature %f C\n", fTemp);

    fPressure = ms5611_2.readPressure();
    if (fPressure > 0) printf("    Pressure %f mBar\n", fPressure);
    
_delayMS(100);

    // Launch sampling thread
    if (pthread_create( &thread, NULL, samplingThreadFunc, NULL)) {
        printf("Failed to launch sampling thread\n");
    }

_delayMS(100);

    // Proceed to answer HTTP requests  
    CreateHTTPserver(&ms5611_1, &ms5611_2, &ads1256, &dac8552);
    
    return 0;
}


