
    
    
    function SaveConfiguration()
	{
		if (confirm("Do you want to update saved configuration?") == false) return;
        
        const ipAddress = window.location.hostname;
		
	    fetch(`http://${ipAddress}:8081/config.json`,
	    {
		    method  : 'PUT',
		    headers : new Headers({'content-type': 'application/json'}),
		    body    : JSON.stringify(
            {  "MS5611_1":
                {
                    "Temperature":
                    {
                        "Checked": $("idTemperature").checked,
                        "Min"    : fTemperatureMin,
                        "Max"    : fTemperatureMax,
                        "Color"  : $("idTemperatureColor").value
                    },
                    "Pressure":
                    {
                        "Checked": $("idPressure").checked,
                        "Min"    : fPressureMin,
                        "Max"    : fPressureMax,
                        "Color"  : $("idPressureColor").value,
                        "Dim"    : strPressureDim
                    }
                },
                "MS5611_2":
                {
                    "Temperature":
                    {
                        "Checked": $("idTemperature2").checked,
                        "Min"    : fTemperatureMin2,
                        "Max"    : fTemperatureMax2,
                        "Color"  : $("idTemperatureColor2").value
                    },
                    "Pressure":
                    {
                        "Checked": $("idPressure2").checked,
                        "Min"    : fPressureMin2,
                        "Max"    : fPressureMax2,
                        "Color"  : $("idPressureColor2").value,
                        "Dim"    : strPressureDim2
                    }
                },
                "ADS1256":
                {
                    "Thermocouple":
                    {
                        "Checked": $("idThermocouple").checked,
                        "Min"    : fThermocoupleMin,
                        "Max"    : fThermocoupleMax,
                        "Color"  : $("idThermocoupleColor").value
                    },
                    "ThermistorV":
                    {
                        "Checked": $("idThermistorV").checked,
                        "Min"    : fThermistorVMin,
                        "Max"    : fThermistorVMax,
                        "Color"  : $("idThermistorVColor").value
                    },
                    "ThermistorR":
                    {
                        "Checked": $("idThermistorR").checked,
                        "Min"    : fThermistorRMin,
                        "Max"    : fThermistorRMax,
                        "Color"  : $("idThermistorRColor").value
                    },
                    "Flux":
                    {
                        "Checked": $("idFlux").checked,
                        "Min"    : fFluxMin,
                        "Max"    : fFluxMax,
                        "Color"  : $("idFluxColor").value
                    }
                }
            })
		   //mode    : 'cors'
	   })
	   .then((res)  => res.text())
	   .then((data) => {console.log(data)})
	   .catch((err) => console.log(err))
    }


	async function FetchConfiguration()
	{
        const ipAddress = window.location.hostname;
        
		if (confirm("Do you want to load saved configuration?\nThe current configuration will be overwritten") == false) return;

		try
		{
			const response = await fetch(`http://${ipAddress}:8081/config.json`);
            if (!response.ok)
            {
                alert("No saved configuraton found.\nYou need to save configuration first");
                return;
            }
            
			const summary  = await response.text();
			console.log(summary);
			
			const obj = JSON.parse(summary);
			
			// $("idBARA")
			
				$("idTemperature").checked     = obj["MS5611_1"].Temperature.Checked;
				fTemperatureMin                = obj["MS5611_1"].Temperature.Min;
				fTemperatureMax                = obj["MS5611_1"].Temperature.Max;
				$("idTemperatureColor").value  = obj["MS5611_1"].Temperature.Color;
														
				$("idPressure").checked        = obj["MS5611_1"].Pressure.Checked;
				fPressureMin                   = obj["MS5611_1"].Pressure.Min;
				fPressureMax                   = obj["MS5611_1"].Pressure.Max;
				$("idPressureColor").value     = obj["MS5611_1"].Pressure.Color;
				// no special update for values is needed as soon as the values are saved/loaded in this dim
                strPressureDim                 = obj["MS5611_1"].Pressure.Dim;	
			
			// $("idBARA2")
			
				$("idTemperature2").checked    = obj["MS5611_2"].Temperature.Checked;
				fTemperatureMin2               = obj["MS5611_2"].Temperature.Min;
				fTemperatureMax2               = obj["MS5611_2"].Temperature.Max;
				$("idTemperatureColor2").value = obj["MS5611_2"].Temperature.Color;
														
				$("idPressure2").checked       = obj["MS5611_2"].Pressure.Checked;
				fPressureMin2                  = obj["MS5611_2"].Pressure.Min;
				fPressureMax2                  = obj["MS5611_2"].Pressure.Max;
				$("idPressureColor2").value    = obj["MS5611_2"].Pressure.Color;
                // no special update for values is needed as soon as the values are saved/loaded in this dim
				strPressureDim2                = obj["MS5611_2"].Pressure.Dim;	

			// $("idFOA")
												
				$("idThermocouple").checked    = obj["ADS1256"].Thermocouple.Checked;
				fThermocoupleMin               = obj["ADS1256"].Thermocouple.Min;
				fThermocoupleMax               = obj["ADS1256"].Thermocouple.Max;
				$("idThermocoupleColor").value = obj["ADS1256"].Thermocouple.Color;
									
				$("idThermistorV").checked     = obj["ADS1256"].ThermistorV.Checked;
				fThermistorVMin                = obj["ADS1256"].ThermistorV.Min;
				fThermistorVMax                = obj["ADS1256"].ThermistorV.Max;
				$("idThermistorVColor").value  = obj["ADS1256"].ThermistorV.Color;
										
				$("idThermistorR").checked     = obj["ADS1256"].ThermistorR.Checked;
				fThermistorRMin                = obj["ADS1256"].ThermistorR.Min;
				fThermistorRMax                = obj["ADS1256"].ThermistorR.Max;
				$("idThermistorRColor").value  = obj["ADS1256"].ThermistorR.Color;
											
				$("idFlux").checked            = obj["ADS1256"].Flux.Checked;
				fFluxMin                       = obj["ADS1256"].Flux.Min;
				fFluxMax                       = obj["ADS1256"].Flux.Max;
				$("idFluxColor").value         = obj["ADS1256"].Flux.Color;
			
			InitGUIparamsFromData();
			
			CalcGUIcoefficients();

		}
		catch (error)
		{
			console.log('Error:' + error.message);
		}
	}
