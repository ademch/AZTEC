
#ifndef HTTP_SERVER_H
#define HTTP_SERVER_H

#include "ADS1256.h"
#include "MS5611.h"

int CreateHTTPserver(MS5611* ms5611, ADS1256* ads1256);

#endif