

	async function DisableInactiveDevices()
	{
        const ipAddress = window.location.hostname;
        
        try
        {
            const response = await fetch(`http://${ipAddress}:8081/BARAconnected1`);
            const summary  = await response.text();
            
            $("idBARA").checked  = (summary === "1");
            $("idBARA").disabled = (summary === "0");
            
            $("idBARA").dataset.userInfo = (summary === "0") ? "disabled" : "enabled";
        }
        catch (error)
        {
            console.log('Error:' + error.message);
        }
        
        try
        {
            const response = await fetch(`http://${ipAddress}:8081/BARAconnected2`);
            const summary  = await response.text();
            
            $("idBARA2").checked  = (summary === "1");
            $("idBARA2").disabled = (summary === "0");

            $("idBARA2").dataset.userInfo = (summary === "0") ? "disabled" : "enabled";
        }
        catch (error)
        {
            console.log('Error:' + error.message);
        }
        
        try
        {
            const response = await fetch(`http://${ipAddress}:8081/FOAconnected`);
            const summary  = await response.text();
            
            $("idFOA").checked  = (summary === "1");
            $("idFOA").disabled = (summary === "0");
            
            $("idFOA").dataset.userInfo = (summary === "0") ? "disabled" : "enabled";

        }
        catch (error)
        {
            console.log('Error:' + error.message);
        }
    }

	function PingHTTPserver()
	{
        const ipAddress = window.location.hostname;

	    fetch(`http://${ipAddress}:8081/`,
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
	
	
	async function fetchDataAsync()
	{
		let fTemperature;
		let fPressure;
		let fTemperature2;
		let fPressure2;
		let fThCvoltage;
        let fThCvoltageMV;
		let fThermVoltage;
		let fThermResistance;
		let fFlux;
        
        const ipAddress = window.location.hostname;

		
		if ($("idBARA").checked == true)
		{
			try
			{
				const response = await fetch(`http://${ipAddress}:8081/BARAtemperature1`);
				const summary  = await response.text();
				console.log(summary);
				
				fTemperature = parseFloat(summary);
				
				$("idTemperatureLabel").innerHTML = "Temperature: " + fTemperature.toFixed(2) + " °C";
				
				let point = {};
				point.value = fTemperature;
				point.time  = Date.now();
				
				aPointsTemp.push(point);
			}
			catch (error)
			{
				console.log('Error:' + error.message);
			}
			
			try
			{
				const response = await fetch(`http://${ipAddress}:8081/BARApressure1`);
				const summary  = await response.text();
				console.log(summary);
				
				fPressure = parseFloat(summary);
				
				if (strPressureDim == "kPa")
					$("idPressureLabel").textContent = "Pressure: " + (fPressure*0.1).toFixed(3) + " kPa";
				else
					$("idPressureLabel").textContent = "Pressure: " + fPressure.toFixed(2) + " mBar";

				let point = {};
				point.value = fPressure;
				point.time  = Date.now();
				
				aPointsBaro.push(point);
			}
			catch (error)
			{
				console.log('Error:' + error.message);
			}
		}
		
		if ($("idBARA2").checked == true)
		{
			try
			{
				const response = await fetch(`http://${ipAddress}:8081/BARAtemperature2`);
				const summary  = await response.text();
				console.log(summary);
				
				fTemperature2 = parseFloat(summary);
				
				$("idTemperatureLabel2").innerHTML = "Temperature: " + fTemperature2.toFixed(2) + " °C";
				
				let point = {};
				point.value = fTemperature2;
				point.time  = Date.now();
				
				aPointsTemp2.push(point);
			}
			catch (error)
			{
				console.log('Error:' + error.message);
			}
			
			try
			{
				const response = await fetch(`http://${ipAddress}:8081/BARApressure2`);
				const summary  = await response.text();
				console.log(summary);
				
				fPressure2 = parseFloat(summary);
				
				if (strPressureDim2 == "kPa")
					$("idPressureLabel2").textContent = "Pressure: " + (fPressure2*0.1).toFixed(3) + " kPa";
				else
					$("idPressureLabel2").textContent = "Pressure: " + fPressure2.toFixed(2) + " mBar";

				let point = {};
				point.value = fPressure2;
				point.time  = Date.now();
				
				aPointsBaro2.push(point);
			}
			catch (error)
			{
				console.log('Error:' + error.message);
			}
		}

		if ($("idFOA").checked == true)
		{
			try
			{
				const response = await fetch(`http://${ipAddress}:8081/FOAthermocouple`);
				const summary  = await response.text();
				console.log(summary);
				
				fThCvoltage = parseFloat(summary);
				fThCvoltageMV = fThCvoltage*1000;

				$("idThermocoupleLabel").textContent = "Thermocouple: " + fThCvoltageMV.toFixed(3) + " mV";

				let point = {};
				point.value = fThCvoltageMV;
				point.time  = Date.now();
				
				aPointsThermocouple.push(point);
			}
			catch (error)
			{
				console.log('Error:' + error.message);
			}
            
			try
			{
				const response = await fetch(`http://${ipAddress}:8081/FOAthermistorV`);
				const summary  = await response.text();
				console.log(summary);
				
				fThermVoltage = parseFloat(summary);
				
				$("idThermistorVLabel").textContent = "Thermistor V: " + summary + " v";
				
				let point = {};
				point.value = fThermVoltage;
				point.time  = Date.now();
				
				aPointsThermistorV.push(point);
			}
			catch (error)
			{
				console.log('Error:' + error.message);
			}
            
			try
			{
				const response = await fetch(`http://${ipAddress}:8081/FOAthermistorR`);
				const summary  = await response.text();
				console.log(summary);
				
				fThermResistance = parseFloat(summary);
				
				$("idThermistorRLabel").textContent = "Thermistor R: " + fThermResistance.toFixed(2) + " Ω";
				
				let point = {};
				point.value = fThermResistance;
				point.time  = Date.now();
				
				aPointsThermistorR.push(point);
			}
			catch (error)
			{
				console.log('Error:' + error.message);
			}
			
			try
			{
				const K20    = 3.11;     // mV*m^2 / kW
                const alpha  = 0.0166;
                const Rconst = 177.0;    // Ohm
                const Vzero  = 10.041;   // zero level
                
                fFlux  = ((fThCvoltageMV - Vzero) / (1.0 + alpha * (fThermResistance - Rconst))) / K20;
                fFlux *= 1000;           // convert kW to Watts
				console.log(fFlux);
				
				$("idFluxLabel").textContent = "Flux: " + fFlux.toFixed(2) + " W/m²";
				
				let point = {};
				point.value = fFlux;
				point.time  = Date.now();
				
				aPointsFlux.push(point);
			}
			catch (error)
			{
				console.log('Error:' + error.message);
			}
		}
		
		DrawPlot();
	}
