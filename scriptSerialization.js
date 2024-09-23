	
	
    function SaveDataLog()
	{
        let arrayOfEntityNames = [];
        let arrayOfEntities = [];
        
        // if device connected
   		if ($("idBARA").disabled == false)
        {
            // if there is data collected ignore entity checkbox
            if (aPointsTemp.length > 0) {
                arrayOfEntities.push(aPointsTemp);
                arrayOfEntityNames.push("Temp A,°C");
            }
            
            // if there is data collected ignore entity checkbox
            if (aPointsBaro.length > 0) {
                arrayOfEntities.push(aPointsBaro);
                arrayOfEntityNames.push("Baro A,mBar");
            }
        }
   		if ($("idBARA2").disabled == false)
        {
            // if there is data collected ignore entity checkbox
            if (aPointsTemp2.length > 0) {
                arrayOfEntities.push(aPointsTemp2);
                arrayOfEntityNames.push("Temp B,°C");
            }
            
            // if there is data collected ignore entity checkbox
            if (aPointsBaro2.length > 0) {
                arrayOfEntities.push(aPointsBaro2);
                arrayOfEntityNames.push("Baro B,mBar");
            }
        }
   		if ($("idFOA").disabled == false)
        {
            // if there is data collected ignore entity checkbox
            if (aPointsThermocouple.length > 0) {
                arrayOfEntities.push(aPointsThermocouple);
                arrayOfEntityNames.push("Thermocouple,mV");
            }
            // if there is data collected ignore entity checkbox
            if (aPointsThermistorV.length > 0) {
                arrayOfEntities.push(aPointsThermistorV);
                arrayOfEntityNames.push("ThermistorV,V");
            }
            // if there is data collected ignore entity checkbox
            if (aPointsThermistorR.length > 0) {
                arrayOfEntities.push(aPointsThermistorR);
                arrayOfEntityNames.push("ThermistorR,Ω");
            }
            // if there is data collected ignore entity checkbox
            if (aPointsFlux.length > 0) {
                arrayOfEntities.push(aPointsFlux);
                arrayOfEntityNames.push("Flux,W/m²");
            }
        }

        // check there are devices to log
        if (arrayOfEntityNames.length == 0)
        {
            alert("No data collected. Nothing to save");
            return;
        }

        // internal check: all arrays have to be of the same size
        const sizeRows = arrayOfEntities[0].length;
        if ( !arrayOfEntities.every(refArray => refArray.length === sizeRows) )
        {
            alert("Arrays consistency check failed");
            return;
        }
        
        // start the log string
        let strLog;
        
        // add titles of the rows
        strLog = "Timestamp\t" + arrayOfEntityNames.join('\t') + '\n';
        
        
        for (let iRow=0; iRow < sizeRows; iRow++)
        {
            let dataTime = new Date(arrayOfEntities[0][iRow].time);
            strLog += dataTime.toLocaleString('en-GB', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit',
                                                hour12: false,
                                            });
            strLog += "\t";
            
            let aRow = [];
            for (let iCol=0; iCol < arrayOfEntities.length; iCol++)
            {
                let aPoints = arrayOfEntities[iCol];
                aRow.push(aPoints[iRow].value.toFixed(2));
            }
            
            strLog += aRow.join('\t') + '\n';
        }
        
		let timeNow = new Date();
            let localDate    = String(timeNow.getDate()).padStart(2, 0);
            let localMonth   = String(timeNow.getMonth()).padStart(2, 0);
            let localYear    = String(timeNow.getFullYear());
            let localHours   = String(timeNow.getHours()).padStart(2, 0);
            let localMinutes = String(timeNow.getMinutes()).padStart(2, 0);
            let localSeconds = String(timeNow.getSeconds()).padStart(2, 0);
        
        let timeNowStr = `${localDate}-${localMonth}-${localYear}_${localHours}-${localMinutes}-${localSeconds}`;
        fetch('http://localhost:8081/log/' + timeNowStr + '.txt',
	    {
		    method  : 'PUT',
		    headers : new Headers({'content-type': 'application/json'}),
		    body    : strLog
		   //mode    : 'cors'
	   })
	   .then(function(res) {    
                                alert(`Log saved with result: ${res.status}`);
                           })
	   .catch((err) => console.log(err))
    }
    
    
    function SaveConfiguration()
	{
		if (confirm("Do you want to update saved configuration?") == false) return;
		
	    fetch('http://localhost:8081/config.json',
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
		if (confirm("Do you want to load saved configuration?\nThe current configuration will be overwritten") == false) return;

		try
		{
			const response = await fetch('http://localhost:8081/config.json');
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
