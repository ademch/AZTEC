

#ifndef _DAC8552_H_
#define _DAC8552_H_

#include <stdint.h>

// GPIO config
#define DAC8552_CS_PIN      	        4	// P4 (bcm23)


#define DAC8552_BUFFER_A                0b00000000
#define DAC8552_BUFFER_B                0b00000100

#define DAC8552_LOAD_A_IMMEDIATELY      0b00010000
#define DAC8552_LOAD_B_IMMEDIATELY      0b00100000

#define DAC8552_POWER_DOWN_NO           0b00000000
#define DAC8552_POWER_DOWN_1K           0b00000001
#define DAC8552_POWER_DOWN_100K         0b00000010
#define DAC8552_POWER_DOWN_HI_Z         0b00000011

#define DAC8552_Value_MAX               65535

#define DAC8552_VREF                    3.3f



class DAC8552
{
public:

	DAC8552();
    
    void Init(bool bActivate);
    
    bool IsConnected();

    void SetChA_Voltage(float fVoltage);
    void SetChB_Voltage(float fVoltage);
    
    void PowerDownChA(uint8_t mode);
    void PowerDownChB(uint8_t mode);
    
    void SetChA(uint16_t wValue);
    void SetChB(uint16_t wValue);
    
   
private:
	bool bPresentOnBus;
    
    void WriteRaw_(uint8_t controlFlags, uint16_t wValue);
};


#endif
