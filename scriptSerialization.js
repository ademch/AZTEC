	
	
	function SaveConfiguration()
	{
		if (confirm("Do you want to update saved profile?") == false) return;
		
	   fetch('http://localhost:8081/config.json',
	   {
		   method  : 'PUT',
		   headers : new Headers({'content-type': 'application/json'}),
		   body    : JSON.stringify({   "MS5611":
										{
											"Checked"    : $("idBARA").checked,
											"Temperature":
											{
												"Min"    : fTemperatureMin,
												"Max"    : fTemperatureMax,
												"Color"  : $("idTemperatureColor").value,
												"Checked": $("idTemperature").checked
											},
											"Pressure":
											{
												"Min"    : fPressureMin,
												"Max"    : fPressureMax,
												"Color"  : $("idPressureColor").value,
												"Checked": $("idPressure").checked,
												"Dim"    : strPressureDim
											}
										},
										"ADS1256":
										{
											"Checked"    : $("idFOA").checked,
											"Thermocouple":
											{
												"Min"    : fThermocoupleMin,
												"Max"    : fThermocoupleMax,
												"Color"  : $("idThermocoupleColor").value,
												"Checked": $("idThermocouple").checked
											},
											"ThermistorV":
											{
												"Min"    : fThermistorVMin,
												"Max"    : fThermistorVMax,
												"Color"  : $("idThermistorVColor").value,
												"Checked": $("idThermistorV").checked
											},
											"ThermistorR":
											{
												"Min"    : fThermistorRMin,
												"Max"    : fThermistorRMax,
												"Color"  : $("idThermistorRColor").value,
												"Checked": $("idThermistorR").checked
											},
											"Flux":
											{
												"Min"    : fFluxMin,
												"Max"    : fFluxMax,
												"Color"  : $("idFluxColor").value,
												"Checked": $("idFlux").checked
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
		if (confirm("Do you want to load profile?\nThe current settings will be overwritten") == false) return;

		try
		{
			const response = await fetch('http://localhost:8081/config.json');
			const summary  = await response.text();
			console.log(summary);
			
			const obj = JSON.parse(summary);
			
			$("idBARA").checked = obj["MS5611"].Checked;
			
				$("idTemperature").checked    = obj["MS5611"].Temperature.Checked;
				fTemperatureMin               = obj["MS5611"].Temperature.Min;
				fTemperatureMax               = obj["MS5611"].Temperature.Max;
				$("idTemperatureColor").value = obj["MS5611"].Temperature.Color;
														
				$("idPressure").checked       = obj["MS5611"].Pressure.Checked;
				fPressureMin                  = obj["MS5611"].Pressure.Min;
				fPressureMax                  = obj["MS5611"].Pressure.Max;
				$("idPressureColor").value    = obj["MS5611"].Pressure.Color;
				strPressureDim                = obj["MS5611"].Pressure.Dim;	// no special update for values is needed as soon as the values are saved/loaded in this dim
			
			$("idFOA").checked  = obj["ADS1256"].Checked;
												
				$("idThermocouple").checked   = obj["ADS1256"].Thermocouple.Checked;
				fThermocoupleMin              = obj["ADS1256"].Thermocouple.Min;
				fThermocoupleMax              = obj["ADS1256"].Thermocouple.Max;
				$("idThermocoupleColor").value = obj["ADS1256"].Thermocouple.Color;
									
				$("idThermistorV").checked    = obj["ADS1256"].ThermistorV.Checked;
				fThermistorVMin               = obj["ADS1256"].ThermistorV.Min;
				fThermistorVMax               = obj["ADS1256"].ThermistorV.Max;
				$("idThermistorVColor").value = obj["ADS1256"].ThermistorV.Color;
										
				$("idThermistorR").checked    = obj["ADS1256"].ThermistorR.Checked;
				fThermistorRMin               = obj["ADS1256"].ThermistorR.Min;
				fThermistorRMax               = obj["ADS1256"].ThermistorR.Max;
				$("idThermistorRColor").value = obj["ADS1256"].ThermistorR.Color;
											
				$("idFlux").checked           = obj["ADS1256"].Flux.Checked;
				fFluxMin                      = obj["ADS1256"].Flux.Min;
				fFluxMax                      = obj["ADS1256"].Flux.Max;
				$("idFluxColor").value        = obj["ADS1256"].Flux.Color;
			
			InitGUIparamsFromData();
			
			CalcGUIcoefficients();

		}
		catch (error)
		{
			console.log('Error:' + error.message);
		}
	}
