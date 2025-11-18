
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include <vector>
#include <string>
#include <time.h>

#include "ADS1256.h"
#include "MS5611.h"

#include "ThreadSampling.h"

#include <pthread.h>

bool bTerminateThread = false;

extern MS5611  ms5611_1;
extern MS5611  ms5611_2;
extern ADS1256 ads1256;

SampledValues sampledValues;


FILE* SaveDataLogStart(const char* strFilePath)
{
    FILE* fdFile = fopen(strFilePath, "a");
    if (!fdFile)
    {
        printf("Cannot save file path : %s\n", strFilePath);
        return NULL;
    }
    
    time_t now = time(nullptr);
    tm *lclTime = localtime(&now);
    
    fprintf(fdFile, "\nStarted log on %d-%02d-%02d\n",
        lclTime->tm_year + 1900,
        lclTime->tm_mon+1,
        lclTime->tm_mday);

    fprintf(fdFile, "%s\t", "Timestamp");

    // if device connected
    if (ms5611_1.IsConnected())
    {
        fprintf(fdFile, "%s\t", "Temp A,°C");
        fprintf(fdFile, "%s\t", "Baro A,mBar");
    }
    // if device connected
    if (ms5611_2.IsConnected())
    {
        fprintf(fdFile, "%s\t", "Temp B,°C");
        fprintf(fdFile, "%s\t", "Baro B,mBar");
    }
    // if device connected
    if (ads1256.IsConnected())
    {
        fprintf(fdFile, "%s\t", "Thermocouple,mV");
        fprintf(fdFile, "%s\t", "ThermistorV,V");
        fprintf(fdFile, "%s\t", "ThermistorR,Ω");
        fprintf(fdFile, "%s\t", "Flux,W/m²");
    }
    fprintf(fdFile, "\n");
    
    fflush(fdFile);
    
    int fd = fileno(fdFile);
    fsync(fd);
    
    return fdFile;
}


void SaveDataLog(FILE* fdFile)
{
    time_t now = time(nullptr);
    tm *lclTime = localtime(&now);

    fprintf(fdFile, "%02d:%02d:%02d\t", lclTime->tm_hour, lclTime->tm_min, lclTime->tm_sec);

    // if device connected
    if (ms5611_1.IsConnected())
    {
        fprintf(fdFile, "%.3f\t", sampledValues.fTemp1);
        fprintf(fdFile, "%.3f\t", sampledValues.fPressure1);
    }
    // if device connected
    if (ms5611_2.IsConnected())
    {
        fprintf(fdFile, "%.3f\t", sampledValues.fTemp2);
        fprintf(fdFile, "%.3f\t", sampledValues.fPressure2);
    }
    // if device connected
    if (ads1256.IsConnected())
    {
        fprintf(fdFile, "%.3f\t", sampledValues.fThermocoupleVoltage*1000.0f);
        fprintf(fdFile, "%.3f\t", sampledValues.fThermistorVoltage);
        fprintf(fdFile, "%.3f\t", sampledValues.fThermistorResistance);
        fprintf(fdFile, "%.3f\t", sampledValues.fFlux);
    }
    fprintf(fdFile, "\n");
    
    fflush(fdFile);
    
    int fd = fileno(fdFile);
    fsync(fd);
}

extern const char* DOCUMENT_ROOT;

void *samplingThreadFunc(void* ptr)
{
    bTerminateThread = false;
    
    printf("\n* Monitoring thread started\n");
    
    char filePath[500] = {0};
    sprintf(filePath, "%s/log/Logfile.txt", DOCUMENT_ROOT);
    FILE* fdFile = SaveDataLogStart(filePath);
    
    if (!fdFile) return NULL;
    
    while (!bTerminateThread)
    {
        sampledValues.fTemp1  = ms5611_1.readTemperature();
        sampledValues.fTemp2  = ms5611_2.readTemperature();
 
        sampledValues.fPressure1  = ms5611_1.readPressure();
        sampledValues.fPressure2  = ms5611_2.readPressure();
 
        sampledValues.fThermocoupleVoltage    = ads1256.GetChannelValue(ADS1256_AIN_THERMOCOUPLE_V);
        sampledValues.fThermistorVoltage      = ads1256.GetChannelValue(ADS1256_AIN_THERMISTOR_V);
        sampledValues.fThermistorResistance   = ads1256.GetThermistorResistance();
 
        const float K20    = 3.11;      // mV*m^2 / kW
        const float alpha  = 0.0166;
        const float Rconst = 177.0;     // ohm
        const float Vzero  = 0.0;    	// zero level compensation
 
        // shortcuts for code readability
        const float fThermistorR  = sampledValues.fThermistorResistance;
        const float fThCvoltageMV = sampledValues.fThermocoupleVoltage*1000.0f;
  
        sampledValues.fFlux  = ((fThCvoltageMV - Vzero) / (1.0 + alpha * (fThermistorR - Rconst))) / K20;
        sampledValues.fFlux *= 1000;    // convert kW to Watts
  
        SaveDataLog(fdFile);
 
        sleep(1);
    }
    
    fprintf(fdFile, "\n");
    
    fclose(fdFile);
    
    return NULL;
}


