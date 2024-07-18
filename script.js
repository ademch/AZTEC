

    var $  = function( id ) { return document.getElementById( id ); };
    var $F = function( id ) { return parseFloat(document.getElementById( id ).value); };

	let c = $("FrontCanvas");
	let ctx = c.getContext("2d");
	
	var idInterval   = -1;	// interval identifier
	
	var iTimeMSstart = Date.now();
	var iMScurrent   = 0;

	var aPointsTemp = [];
	var aPointsBaro = [];
	var aPointsThermocouple = [];
	var aPointsThermistorV = [];
	var aPointsThermistorR = [];
	var aPointsFlux = [];
	
	var iLeftMargin   = 150;
	var iRightMargin  = 340;
	var iTopMargin    = 70;
	var iBottomMargin = 110;
	
	var iLeftAbs   = iLeftMargin;
	var iRightAbs  = c.width-iRightMargin;
	var iTopAbs    = iTopMargin;
	var iBottomAbs = c.height-iBottomMargin;
	
	var iTimeMSCompressedThreshold = 0;
	var iStepCompressed = 10;
	var iStepNormal = 10;
	var iSecondsInCompressedRange = 100;	// shortcut describing the number of seconds held by compressed part of the graph
	
	
	// Initial values
	var strPressureDim = "kPa";

	var fTemperatureMin = -30;
	var fTemperatureMax =  70;
	
	var fPressureMin    = 0;
	var fPressureMax    = 200;
	
	var fThermocoupleMin = 0;
	var fThermocoupleMax = 20;
	
	var fThermistorVMin = 1.5;
	var fThermistorVMax = 2.0;
	
	var fThermistorRMin = 150;
	var fThermistorRMax = 200;
	
	var fSolarEnergyMin = 0;
	var fSolarEnergyMax = 3000;
	
	
	function PressureDimensionChanged(object)
	{
		var Selection = object.value;
		
		if (Selection == "mBar")
		{
			let fVal;
			fVal = $("idPressureMin").value;
			
			$("idPressureMin").value = fVal*10;
			fPressureMin = fVal*10;
			
			fVal = $("idPressureMax").value;
			$("idPressureMax").value = fVal*10;
			fPressureMax = fVal*10;
			
			$("pressureDim1").innerHTML = 'mBar';
			$("pressureDim2").innerHTML = 'mBar';
		}
		else
		{
			let fVal;
			fVal = $("idPressureMin").value;
			
			$("idPressureMin").value = fVal/10;
			fPressureMin = fVal/10;
			
			fVal = $("idPressureMax").value;
			$("idPressureMax").value = fVal/10;
			fPressureMax = fVal/10;
			
			$("pressureDim1").innerHTML = 'kPa';
			$("pressureDim2").innerHTML = 'kPa';
		}
		
		DrawPlot();
	}
	

	// GUI init
	function InitGUIparamsFromCodeValues()
	{
		$("idPressureDimSelector").value = strPressureDim;

		$("idTemperatureMin").value  = fTemperatureMin;
		$("idTemperatureMax").value  = fTemperatureMax;

		$("idPressureMin").value     = fPressureMin;
		$("idPressureMax").value     = fPressureMax;

		$("idThermocoupleMin").value = fThermocoupleMin;
		$("idThermocoupleMax").value = fThermocoupleMax;

		$("idThermistorVMin").value  = fThermistorVMin;
		$("idThermistorVMax").value  = fThermistorVMax;
		
		$("idThermistorRMin").value  = fThermistorRMin;
		$("idThermistorRMax").value  = fThermistorRMax;

		$("idSolarEnergyMin").value  = fSolarEnergyMin;
		$("idSolarEnergyMax").value  = fSolarEnergyMax;
		
		DrawPlot();
		
	}

	// GUI to document
	function FocusLost()
	{
		fTemperatureMin  = $F("idTemperatureMin");
		fTemperatureMax  = $F("idTemperatureMax");
		
		fPressureMin     = $F("idPressureMin");
		fPressureMax     = $F("idPressureMax");

		fThermocoupleMin = $F("idThermocoupleMin");
		fThermocoupleMax = $F("idThermocoupleMax");
		
		fThermistorVMin  = $F("idThermistorVMin");
		fThermistorVMax  = $F("idThermistorVMax");
		
		fThermistorRMin  = $F("idThermistorRMin");
		fThermistorRMax  = $F("idThermistorRMax");
		
		fSolarEnergyMin  = $F("idSolarEnergyMin");
		fSolarEnergyMax  = $F("idSolarEnergyMax");
		
		DrawPlot();
	}
	
	
	function StartAutoUpdate()
	{
		idInterval = setInterval(fetchDataAsync, 1000);
		
		iTimeMSstart = Date.now();
		iTimeMSCompressedThreshold = iTimeMSstart + 100*1000;
		iTimeMSTotalThreshold = iTimeMSstart + 160*1000;
	}
	
	function StopAutoUpdate()
	{
		if (idInterval != -1) clearInterval(idInterval);
	}
	
	async function fetchDataAsync()
	{
		try
		{
			const response = await fetch('http://localhost:8081/BARAtemperature');
			const summary  = await response.text();
			console.log(summary);
			
			const changeText = document.querySelector("#idTemperatureLabel");

			changeText.innerHTML = "Temperature: " + parseFloat(summary).toFixed(2) + " °C";
			
			let point = {};
			point.value = parseFloat(summary);
			point.time = Date.now();
			
			aPointsTemp.push(point);
		}
		catch (error)
		{
			console.log('Error:' + error.message);
		}
		try
		{
			const response = await fetch('http://localhost:8081/BARApressure');
			const summary  = await response.text();
			console.log(summary);
			
			const changeText = document.querySelector("#idPressureLabel");
			
			let Selection = $("idPressureDimSelector").value;
		
			if (Selection == "kPa")
				changeText.textContent = "Pressure: " + (parseFloat(summary)*0.1).toFixed(2) + " kPa";
			else
				changeText.textContent = "Pressure: " + parseFloat(summary).toFixed(1) + " mBar";


			let point = {};
			point.value = parseFloat(summary);
			point.time = Date.now();
			
			aPointsBaro.push(point);
		}
		catch (error)
		{
			console.log('Error:' + error.message);
		}
		try
		{
			const response = await fetch('http://localhost:8081/FOAthermocouple');
			const summary  = await response.text();
			console.log(summary);
			
			const changeText = document.querySelector("#idThermocoupleLabel");
			
			let fValMV = parseFloat(summary)*1000;

			changeText.textContent = "Thermocouple: " + fValMV.toFixed(3) + " mV";

			let point = {};
			point.value = fValMV;
			point.time = Date.now();
			
			aPointsThermocouple.push(point);
		}
		catch (error)
		{
			console.log('Error:' + error.message);
		}
		try
		{
			const response = await fetch('http://localhost:8081/FOAthermistorV');
			const summary  = await response.text();
			console.log(summary);
			
			const changeText = document.querySelector("#idThermistorVLabel");

			changeText.textContent = "Thermistor V: " + summary + " v";
			
			let point = {};
			point.value = parseFloat(summary);
			point.time = Date.now();
			
			aPointsThermistorV.push(point);
		}
		catch (error)
		{
			console.log('Error:' + error.message);
		}
		try
		{
			const response = await fetch('http://localhost:8081/FOAthermistorR');
			const summary  = await response.text();
			console.log(summary);
			
			const changeText = document.querySelector("#idThermistorRLabel");

			changeText.textContent = "Thermistor R: " + parseFloat(summary).toFixed(2) + " Ω";
			
			let point = {};
			point.value = parseFloat(summary);
			point.time = Date.now();
			
			aPointsThermistorR.push(point);
		}
		catch (error)
		{
			console.log('Error:' + error.message);
		}
		try
		{
			const response = await fetch('http://localhost:8081/FOAflux');
			const summary  = await response.text();
			console.log(summary);
			
			const changeText = document.querySelector("#idSolarEnergyLabel");

			changeText.textContent = "Flux: " + parseFloat(summary).toFixed(2) + " W/m²";
			
			let point = {};
			point.value = parseFloat(summary);
			point.time = Date.now();
			
			aPointsFlux.push(point);
		}
		catch (error)
		{
			console.log('Error:' + error.message);
		}
		
		DrawPlot();
	}
	
	
	function DrawRangeMarks()
	{
		ctx.font = "bold 20px serif";

		// Temperature
		ctx.fillStyle = $("idTemperatureColor").value;
		ctx.fillText("°C", 10, c.height-45);
		ctx.fillText("T", 18, c.height-15);
			
		//ctx.fillStyle = "black";
		
		let fCurrent = fTemperatureMin;
		let fDelta  = (fTemperatureMax - fTemperatureMin)/10;
		for (i=0; i<=10; i++)
		{
				ctx.fillText(Number(fCurrent.toFixed(1)), 10, iBottomAbs - 5 - i*80);
				fCurrent = fCurrent + fDelta;
		}
		
		// Pressure
		let Selection = $("idPressureDimSelector").value;
		
		ctx.fillStyle = $("idPressureColor").value;
		if (Selection == "kPa")
			ctx.fillText("kPa", 70, c.height-45);
		else
			ctx.fillText("mBar", 70, c.height-45);
		ctx.fillText("Ps", 70, c.height-15);
		
		//ctx.fillStyle = "black";
		
		fCurrent = fPressureMin;
		fDelta  = (fPressureMax - fPressureMin)/10;
		for (i=0; i<=10; i++)
		{
				ctx.fillText(Number(fCurrent.toFixed(1)), 70, iBottomAbs - 5 - i*80);
				fCurrent = fCurrent + fDelta;
		}
		
		// Solar W/m2
		ctx.fillStyle = $("idSolarEnergyColor").value;
		ctx.fillText("W/m²", c.width - 310, c.height-45);
		ctx.fillText("Flux", c.width - 310, c.height-15);
		
		//ctx.fillStyle = "black";
		
		fCurrent = fSolarEnergyMin;
		fDelta  = (fSolarEnergyMax - fSolarEnergyMin)/10;
		for (i=0; i<=10; i++)
		{
				ctx.fillText(Number(fCurrent.toFixed(1)), c.width - 310, iBottomAbs - 5 - i*80);
				fCurrent = fCurrent + fDelta;
		}
		
		// Thermocouple mV
		ctx.fillStyle = $("idThermocoupleColor").value;
		ctx.fillText("mV", c.width - 220, c.height-45);
		ctx.fillText("ThC", c.width - 220, c.height-15);
		
		//ctx.fillStyle = "black";
		
		fCurrent = fThermocoupleMin;
		fDelta  = (fThermocoupleMax - fThermocoupleMin)/10;
		for (i=0; i<=10; i++)
		{
				ctx.fillText(Number(fCurrent.toFixed(1)), c.width - 220, iBottomAbs - 5 - i*80);
				fCurrent = fCurrent + fDelta;
		}
		
		// Thermoresistor Ohm
		ctx.fillStyle = $("idThermistorRColor").value;
		ctx.fillText("Ω", c.width - 150, c.height-45);
		ctx.fillText("ThR", c.width - 150, c.height-15);
		
		//ctx.fillStyle = "black";
		
		fCurrent = fThermistorRMin;
		fDelta  = (fThermistorRMax - fThermistorRMin)/10;
		for (i=0; i<=10; i++)
		{
				ctx.fillText(Number(fCurrent.toFixed(1)), c.width - 150, iBottomAbs - 5 - i*80);
				fCurrent = fCurrent + fDelta;
		}
		
		// Thermistor voltage
		ctx.fillStyle = $("idThermistorVColor").value;
		ctx.fillText("V", c.width - 70, c.height-45);
		ctx.fillText("ThV", c.width - 70, c.height-15);
		
		//ctx.fillStyle = "black";
		
		fCurrent = fThermistorVMin;
		fDelta  = (fThermistorVMax - fThermistorVMin)/10;
		for (i=0; i<=10; i++)
		{
				ctx.fillText(fCurrent.toFixed(2), c.width - 70, iBottomAbs - 5 - i*80);
				fCurrent = fCurrent + fDelta;
		}
	}
	
	function DrawCurve(aPoints, fValMin, fValMax, color)
	{
		if (aPoints.length < 1) return;
		
		let iX;
		let iY;
		
		let fValPxPerUnit = (c.height - iTopMargin - iBottomMargin)/(fValMax - fValMin);
		
		ctx.lineWidth = 3;
		ctx.beginPath();
		
		iX = iLeftAbs;
		iY = iBottomAbs - (aPoints[0].value - fValMin) * fValPxPerUnit;
		
		ctx.moveTo(iX, iY);
		for (i=0; i < aPoints.length-1; i++)
		{
			if (aPoints[i].time < iTimeMSCompressedThreshold)
			{
				iX = iLeftAbs+ iStepCompressed*(aPoints[i].time - iTimeMSstart)/1000;
				iY = iBottomAbs - (aPoints[i].value - fValMin) * fValPxPerUnit;
				ctx.lineTo(iX, iY);
			}
			else
			{
				if (aPoints[i].time > iTimeMSTotalThreshold)
				{
					iTimeMSCompressedThreshold += 60*1000;
					iTimeMSTotalThreshold += 60*1000;
					iSecondsInCompressedRange += 60;
					iStepCompressed = 1000/iSecondsInCompressedRange;
					break;
				}
				else
				{
					iX = iLeftAbs + 1000 + iStepNormal*(aPoints[i].time - iTimeMSCompressedThreshold)/1000;
					iY = iBottomAbs - (aPoints[i].value - fValMin) * fValPxPerUnit;
					ctx.lineTo(iX, iY);
				}
			}
		}
		ctx.strokeStyle = color;
		ctx.stroke();
		
		ctx.beginPath();
			ctx.arc(iX, iY, 5, 0, 2 * Math.PI);
			ctx.fillStyle = color;
			ctx.fill();
			ctx.lineWidth = 1;
			ctx.strokeStyle = color;
		ctx.stroke();
	}
	
	
	function DrawPlot()
	{
		let i;

		// STEP: clear canvas
		ctx.clearRect(0, 0, c.width, c.height);

		// STEP: draw border
		ctx.strokeStyle = "black";
		ctx.lineWidth = 2;

		ctx.strokeRect(iLeftAbs, iTopAbs, c.width-iRightMargin - iLeftMargin, c.height-iTopMargin - iBottomMargin);
		
		// STEP: draw vertical dash lines
		ctx.strokeStyle = "black";
		ctx.setLineDash([]);
		ctx.lineWidth = 1;

		for (i=0; i<=16; i++)
		{
			ctx.beginPath();
				ctx.moveTo(iLeftAbs+ i*100, iBottomAbs);
				ctx.lineTo(iLeftAbs+ i*100, iBottomAbs + 10);
			ctx.stroke();
		}

		// STEP: draw vertical threshold line
		ctx.strokeStyle = '#000000';
		ctx.setLineDash([]);
		ctx.lineWidth = 2;

		ctx.beginPath();
			ctx.moveTo(iLeftAbs+ 1000, iBottomAbs);
			ctx.lineTo(iLeftAbs+ 1000, iTopAbs);
		ctx.stroke();
		
				
		// STEP: draw horizontal dash lines
		ctx.strokeStyle = '#B0B0B0';
		//ctx.setLineDash([5,10]);
		ctx.lineWidth = 1;

		for (i=0; i<=10; i++)
		{
			ctx.beginPath();
				ctx.moveTo(0,       iTopAbs + i*80);
				ctx.lineTo(c.width, iTopAbs + i*80);
			ctx.stroke();
		}
		
		// STEP: draw range marks
		DrawRangeMarks();


		// STEP: draw time legend
		ctx.save();
			ctx.rotate(-Math.PI/2);
			ctx.textAlign = "left";
			ctx.font = "20px serif";

			ctx.fillStyle = "black";
			for (i=0; i<=10; i++)
			{
				let localTime = new Date(iTimeMSstart + (iSecondsInCompressedRange/10)*i*1000);
				ctx.fillText(localTime.toLocaleTimeString('it-IT'), -c.height+7, iLeftAbs + 7 + i*100);
			}

			ctx.fillStyle = "purple";
			for (i=1; i<=6; i++)
			{
				let localTime = new Date(iTimeMSstart + iSecondsInCompressedRange*1000 + 10*i*1000);
				ctx.fillText(localTime.toLocaleTimeString('it-IT'), -c.height+7, iLeftAbs + 7 + 1000 + i*100);
			}
		ctx.restore();
		 
		// STEP: draw Temperature plot
		let elColor = $("idTemperatureColor");
		DrawCurve(aPointsTemp, fTemperatureMin, fTemperatureMax, elColor.value);
		
		// STEP: draw Pressure plot
		let Selection = $("idPressureDimSelector").value;
		
		let fScaler = 1;
		if (Selection == "kPa")
			fScaler = 10;
		
		elColor = $("idPressureColor");
		DrawCurve(aPointsBaro, fPressureMin*fScaler, fPressureMax*fScaler, elColor.value);
		
		// STEP: draw Thermocouple plot
		elColor = $("idThermocoupleColor");
		DrawCurve(aPointsThermocouple, fThermocoupleMin, fThermocoupleMax, elColor.value);
		
		// STEP: draw ThermistorV plot
		elColor = $("idThermistorVColor");
		DrawCurve(aPointsThermistorV, fThermistorVMin, fThermistorVMax, elColor.value);
		
		// STEP: draw ThermistorR plot
		elColor = $("idThermistorRColor");
		DrawCurve(aPointsThermistorR, fThermistorRMin, fThermistorRMax, elColor.value);
		
		// STEP: draw Flux plot
		elColor = $("idSolarEnergyColor");
		DrawCurve(aPointsFlux, fSolarEnergyMin, fSolarEnergyMax, elColor.value);
		 
	}
