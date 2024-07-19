	
	function PingHTTPserver()
	{
	   fetch('http://localhost:8081/',
	   {
		   method  : 'HEAD',
	   })
	   .then( function(res) {	
								//console.log($("imgStatus").src);
								if ((res.status == 200) && ($("imgStatus").src.indexOf("animation.gif") == -1))
								{
									$("imgStatus").src ="animation.gif";
								}
							})
	   .catch(function(err) {
								if ($("imgStatus").src.indexOf("static.png") == -1)
									$("imgStatus").src = "static.png";
							});
    }
	
	
	
	function SaveConfiguration()
	{
		if (confirm("Do you want to update profile?") == false) return;
		
	   fetch('http://localhost:8081/config.json',
	   {
		   method  : 'PUT',
		   headers : new Headers({'content-type': 'application/json'}),
		   body    : JSON.stringify({   "MS5611":
										{
											"Temperature":
											{
												"Min"    : fTemperatureMin,
												"Max"    : fTemperatureMax,
												"Color"  : $("idTemperatureColor").value,
											},
											"Pressure":
											{
												"Min"    : fPressureMin,
												"Max"    : fPressureMax,
												"Color"  : $("idPressureColor").value,
											}
										},
										"ADS1256":
										{
											"Thermocouple":
											{
												"Min"    : fThermocoupleMin,
												"Max"    : fThermocoupleMax,
												"Color"  : $("idThermocoupleColor").value,
											},
											"ThermistorV":
											{
												"Min"    : fThermistorVMin,
												"Max"    : fThermistorVMax,
												"Color"  : $("idThermistorVColor").value,
											},
											"ThermistorR":
											{
												"Min"    : fThermistorRMin,
												"Max"    : fThermistorRMax,
												"Color"  : $("idThermistorRColor").value,
											},
											"Flux":
											{
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
		if (confirm("Do you want to load profile?") == false) return;

		try
		{
			const response = await fetch('http://localhost:8081/config.json');
			const summary  = await response.text();
			console.log(summary);
			
			const obj = JSON.parse(summary);
			
			fTemperatureMin = obj["MS5611"].Temperature.TemperatureMin;
			fTemperatureMax = obj["MS5611"].Temperature.TemperatureMax;
													
			fPressureMin = obj["MS5611"].Pressure.PressureMin;
			fPressureMax = obj["MS5611"].Pressure.PressureMax;
												
								
			fThermocoupleMin = obj["ADS1256"].Thermocouple.ThermocoupleMin;
			fThermocoupleMax = obj["ADS1256"].Thermocouple.ThermocoupleMax;
								
			fThermistorVMin = obj["ADS1256"].ThermistorV.ThermistorVMin;
			fThermistorVMax = obj["ADS1256"].ThermistorV.ThermistorVMax;
									
			fThermistorRMin = obj["ADS1256"].ThermistorR.ThermistorRMin;
			fThermistorRMax = obj["ADS1256"].ThermistorR.ThermistorRMax;
										
			fFluxMin = obj["ADS1256"].Flux.FluxMin;
			fFluxMax = obj["ADS1256"].Flux.FluxMax;
			
			InitGUIparamsFromCodeValues();

		}
		catch (error)
		{
			console.log('Error:' + error.message);
		}
	}
