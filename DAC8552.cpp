

#include "DAC8552.h"
#include "Dev_config.h"


DAC8552::DAC8552()
{
    bPresentOnBus = false;
}

void DAC8552::Init(bool bActivate)
{
    bPresentOnBus = bActivate;
}


bool DAC8552::IsConnected()
{
	return bPresentOnBus;
}


void DAC8552::WriteRaw_(uint8_t controlFlags, uint16_t wValue)
{
    DEV_gpio_write(DAC8552_CS_PIN, 0);      // cs stays low during the whole 3 byte sequence
        DEV_SPI_WriteByte(controlFlags);
        DEV_SPI_WriteByte(wValue >> 8);
        DEV_SPI_WriteByte(wValue &  0xff);  
    DEV_gpio_write(DAC8552_CS_PIN, 1);
}

void DAC8552::SetChA(uint16_t wValue)
{
    WriteRaw_(DAC8552_BUFFER_A | DAC8552_LOAD_A_IMMEDIATELY, wValue);
}

void DAC8552::SetChB(uint16_t wValue)
{
    WriteRaw_(DAC8552_BUFFER_B | DAC8552_LOAD_B_IMMEDIATELY, wValue);
}

void DAC8552::PowerDownChA(uint8_t mode)
{
    WriteRaw_(DAC8552_BUFFER_A | DAC8552_LOAD_A_IMMEDIATELY | mode, 0);
}

void DAC8552::PowerDownChB(uint8_t mode)
{
    WriteRaw_(DAC8552_BUFFER_B | DAC8552_LOAD_B_IMMEDIATELY | mode, 0);
}


// fVoltage: 0 to DAC8552_VREF
void DAC8552::SetChA_Voltage(float fVoltage)
{
    if ( (fVoltage <= DAC8552_VREF) &&
         (fVoltage >= 0) )
    {
        SetChA(fVoltage * DAC8552_Value_MAX / DAC8552_VREF);
    }
}


// fVoltage: 0 to DAC8552_VREF
void DAC8552::SetChB_Voltage(float fVoltage)
{
    if ( (fVoltage <= DAC8552_VREF) &&
         (fVoltage >= 0) )
    {
        SetChB(fVoltage * DAC8552_Value_MAX / DAC8552_VREF);
    }
}
