

    var $  = function( id ) { return document.getElementById( id ); };
    var $F = function( id ) { return parseFloat(document.getElementById( id ).value); };

	let c = $("FrontCanvas");
	let ctx = c.getContext("2d");
	
	var idInterval       = -1;	// update interval identifier
	var idIntervalPing   = -1;	// ping interval identifier
	
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
	var iTopMargin    = 50;
	var iBottomMargin = 110;
	
	var iLeftAbs   = iLeftMargin;
	var iRightAbs  = c.width-iRightMargin;
	var iTopAbs    = iTopMargin;
	var iBottomAbs = c.height-iBottomMargin;
	
	var iStepH = (iRightAbs - iLeftAbs)/16;
	var iStepV = (iBottomAbs - iTopAbs)/10;

	var iTimeMSCompressedThreshold = 0;
	var iStepCompressed = 10;
	var iStepNormal     = 10;
	var iSecondsInCompressedRange = 100;	// shortcut describing the number of seconds held by compressed part of the graph
	
	
	// Initial values
	var strPressureDim = "kPa";

	var fTemperatureMin  = -30;
	var fTemperatureMax  = 70;
	
	var fPressureMin     = 0;
	var fPressureMax     = 200;
	
	var fThermocoupleMin = 0;
	var fThermocoupleMax = 20;
	
	var fThermistorVMin  = 1.5;
	var fThermistorVMax  = 2.0;
	
	var fThermistorRMin  = 150;
	var fThermistorRMax  = 200;
	
	var fFluxMin         = 0;
	var fFluxMax         = 3000;
	
	
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
	
	function OnInit()
	{
		InitGUIparamsFromCodeValues();

		idIntervalPing = setInterval(PingHTTPserver, 1000);
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

		$("idFluxMin").value         = fFluxMin;
		$("idFluxMax").value         = fFluxMax;
		
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
		
		fFluxMin         = $F("idFluxMin");
		fFluxMax         = $F("idFluxMax");
		
		DrawPlot();
	}
	
	function GroupVisibilityChanged()
	{
		iLeftMargin   = 150;
		iRightMargin  = 340;
		iTopMargin    = 50;
		iBottomMargin = 110;
		
		if ($("idBARA").checked == false)
		{
			iLeftMargin = 50;
			
			let x = document.getElementsByClassName("BARAclass");
			for (let i = 0; i < x.length; i++) {
				x[i].style.display = "none";
			}
		}
		else
		{
			let x = document.getElementsByClassName("BARAclass");
			for (let i = 0; i < x.length; i++) {
				x[i].style.display = "table-row";
			}
		}

		if ($("idFOA").checked == false)
		{
			iRightMargin  = 40;
			
			let x = document.getElementsByClassName("FOAclass");
			for (let i = 0; i < x.length; i++) {
				x[i].style.display = "none";
			}

		}
		else
		{
			let x = document.getElementsByClassName("FOAclass");
			for (let i = 0; i < x.length; i++) {
				x[i].style.display = "table-row";
			}
		}

		iLeftAbs   = iLeftMargin;
		iRightAbs  = c.width-iRightMargin;
		iTopAbs    = iTopMargin;
		iBottomAbs = c.height-iBottomMargin;
		
		iStepH = (iRightAbs - iLeftAbs)/16;
		iStepV = (iBottomAbs - iTopAbs)/10;
		
		iStepNormal     = iStepH/10;
		iStepCompressed = (iStepH*10)/iSecondsInCompressedRange;
		
		DrawPlot();
	}
	

	function StartAutoUpdate()
	{
		if (idInterval != -1)
		{
			alert("Monitoring is already in progress");
			return;
		}

		if ((aPointsTemp.length && aPointsThermocouple.length) &&
		    (confirm("Previous data will be lost. Continue?") == false)) return;
		    
		$("idBARA").disabled = true;
		$("idFOA").disabled = true;
		    
		aPointsTemp = [];
		aPointsBaro = [];
		aPointsThermocouple = [];
		aPointsThermistorV = [];
		aPointsThermistorR = [];
		aPointsFlux = [];
		
		idInterval = setInterval(fetchDataAsync, 1000);
		
		iTimeMSstart = Date.now();
		iTimeMSCompressedThreshold = iTimeMSstart + 100*1000;
		iTimeMSTotalThreshold = iTimeMSstart + 160*1000;
	}
	
	function StopAutoUpdate()
	{
		if (idInterval != -1)
		{
			clearInterval(idInterval);
			idInterval = -1;
			
			$("idBARA").disabled = false;
			$("idFOA").disabled = false;
		}
	}
	
	async function fetchDataAsync()
	{
		let fTemperature;
		let fPressure;
		let fThCvoltage;
		let fThermVoltage;
		let fThermResistance;
		let fFlux;

		try
		{
			const response = await fetch('http://localhost:8081/BARAtemperature');
			const summary  = await response.text();
			console.log(summary);
			
			fTemperature = parseFloat(summary);
			
			const changeText = document.querySelector("#idTemperatureLabel");

			changeText.innerHTML = "Temperature: " + fTemperature.toFixed(2) + " °C";
			
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
			const response = await fetch('http://localhost:8081/BARApressure');
			const summary  = await response.text();
			console.log(summary);
			
			fPressure = parseFloat(summary);
			
			const changeText = document.querySelector("#idPressureLabel");
			
			let Selection = $("idPressureDimSelector").value;
		
			if (Selection == "kPa")
				changeText.textContent = "Pressure: " + (fPressure*0.1).toFixed(2) + " kPa";
			else
				changeText.textContent = "Pressure: " + fPressure.toFixed(1) + " mBar";


			let point = {};
			point.value = fPressure;
			point.time  = Date.now();
			
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
			
			fThCvoltage = parseFloat(summary);
			
			const changeText = document.querySelector("#idThermocoupleLabel");
			
			let fValMV = fThCvoltage*1000;

			changeText.textContent = "Thermocouple: " + fValMV.toFixed(3) + " mV";

			let point = {};
			point.value = fValMV;
			point.time  = Date.now();
			
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
			
			fThermVoltage = parseFloat(summary);
			
			const changeText = document.querySelector("#idThermistorVLabel");

			changeText.textContent = "Thermistor V: " + summary + " v";
			
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
			const response = await fetch('http://localhost:8081/FOAthermistorR');
			const summary  = await response.text();
			console.log(summary);
			
			fThermResistance = parseFloat(summary);
			
			const changeText = document.querySelector("#idThermistorRLabel");

			changeText.textContent = "Thermistor R: " + fThermResistance.toFixed(2) + " Ω";
			
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
			fFlux  = (fThCvoltage / (1.0 + 0.0166 * (fThermResistance - 177.0))) / 3.11;
			console.log(fFlux);
			
			const changeText = document.querySelector("#idFluxLabel");

			changeText.textContent = "Flux: " + fFlux.toFixed(2) + " W/m²";
			
			let point = {};
			point.value = fFlux;
			point.time  = Date.now();
			
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

		if ($("idBARA").checked == true)
		{
			// Temperature
			ctx.fillStyle = $("idTemperatureColor").value;
			ctx.fillText("°C", 10, c.height-45);
			ctx.fillText("T",  18, c.height-15);
				
			//ctx.fillStyle = "black";
			
			let fCurrent = fTemperatureMin;
			let fDelta  = (fTemperatureMax - fTemperatureMin)/10;
			for (i=0; i<=10; i++)
			{
					ctx.fillText(Number(fCurrent.toFixed(1)), 10, iBottomAbs - 5 - i*iStepV);
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
					ctx.fillText(Number(fCurrent.toFixed(1)), 70, iBottomAbs - 5 - i*iStepV);
					fCurrent = fCurrent + fDelta;
			}
		}
		
		
		if ($("idFOA").checked == true)
		{
			// Solar W/m2
			ctx.fillStyle = $("idFluxColor").value;
			ctx.fillText("W/m²", c.width - 310, c.height-45);
			ctx.fillText("Flux", c.width - 310, c.height-15);
			
			//ctx.fillStyle = "black";
			
			fCurrent = fFluxMin;
			fDelta  = (fFluxMax - fFluxMin)/10;
			for (i=0; i<=10; i++)
			{
					ctx.fillText(Number(fCurrent.toFixed(1)), c.width - 310, iBottomAbs - 5 - i*iStepV);
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
					ctx.fillText(Number(fCurrent.toFixed(1)), c.width - 220, iBottomAbs - 5 - i*iStepV);
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
					ctx.fillText(Number(fCurrent.toFixed(1)), c.width - 150, iBottomAbs - 5 - i*iStepV);
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
					ctx.fillText(fCurrent.toFixed(2), c.width - 70, iBottomAbs - 5 - i*iStepV);
					fCurrent = fCurrent + fDelta;
			}
		}
	}
	
	function DrawCurve(aPoints, fValMin, fValMax, color)
	{
		if (aPoints.length < 1) return;
		
		let fPxPerUnitY = (c.height - iTopMargin - iBottomMargin)/(fValMax - fValMin);

		let iX = iLeftAbs;
		let iY = iBottomAbs - (aPoints[0].value - fValMin) * fPxPerUnitY;
		
		ctx.lineWidth = 3;
		ctx.beginPath();

		ctx.moveTo(iX, iY);
		for (i=0; i < aPoints.length-1; i++)
		{
			if (aPoints[i].time < iTimeMSCompressedThreshold)
			{
				iX = iLeftAbs+ iStepCompressed*(aPoints[i].time - iTimeMSstart)/1000;
				iY = iBottomAbs - (aPoints[i].value - fValMin) * fPxPerUnitY;
				ctx.lineTo(iX, iY);
			}
			else // uncompressed
			{
				if (aPoints[i].time > iTimeMSTotalThreshold)
				{
					iTimeMSCompressedThreshold += 60*1000;	// +60 000 mseconds
					iTimeMSTotalThreshold += 60*1000;       // +60 000 mseconds
					iSecondsInCompressedRange += 60;
					iStepCompressed = (iStepH*10)/iSecondsInCompressedRange;
					
					break;
				}
				else
				{
					iX = iLeftAbs + iStepH*10 + iStepNormal*(aPoints[i].time - iTimeMSCompressedThreshold)/1000;
					iY = iBottomAbs - (aPoints[i].value - fValMin) * fPxPerUnitY;
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
		// STEP: clear canvas
		ctx.fillStyle = "#eeeeee";
		ctx.fillRect(0, 0, c.width, c.height);

		// STEP: draw border
		ctx.strokeStyle = "black";
		ctx.lineWidth = 2;

		// Plot border
		ctx.strokeRect(iLeftAbs, iTopAbs, c.width-iRightMargin - iLeftMargin, c.height-iTopMargin - iBottomMargin);
		
		// STEP: draw vertical dash lines / ticks
		ctx.strokeStyle = "black";
		ctx.setLineDash([]);
		ctx.lineWidth = 1;

		for (let i=0; i<=16; i++)
		{
			ctx.beginPath();
				ctx.moveTo(iLeftAbs+ i*iStepH, iBottomAbs);
				ctx.lineTo(iLeftAbs+ i*iStepH, iBottomAbs + 10);
			ctx.stroke();
		}

		// STEP: draw vertical threshold line
		ctx.strokeStyle = '#000000';
		ctx.setLineDash([]);
		ctx.lineWidth = 2;

		ctx.beginPath();
			ctx.moveTo(iLeftAbs+ 10*iStepH, iBottomAbs);
			ctx.lineTo(iLeftAbs+ 10*iStepH, iTopAbs);
		ctx.stroke();
		
				
		// STEP: draw horizontal dash lines
		ctx.strokeStyle = '#B0B0B0';
		//ctx.setLineDash([5,10]);
		ctx.lineWidth = 1;

		for (let i=0; i<=10; i++)
		{
			ctx.beginPath();
				ctx.moveTo(0,       iTopAbs + i*iStepV);
				ctx.lineTo(c.width, iTopAbs + i*iStepV);
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
			for (let i=0; i<=10; i++)
			{
				let localTime = new Date(iTimeMSstart + (iSecondsInCompressedRange/10)*i*1000);
				ctx.fillText(localTime.toLocaleTimeString('it-IT'), -c.height+7, iLeftAbs + 7 + i*iStepH);
			}

			ctx.fillStyle = "purple";
			for (let i=1; i<=6; i++)
			{
				let localTime = new Date(iTimeMSstart + iSecondsInCompressedRange*1000 + 10*i*1000);
				ctx.fillText(localTime.toLocaleTimeString('it-IT'), -c.height+7, iLeftAbs + 7 + 10*iStepH + i*iStepH);
			}
		ctx.restore();
		
		 
		if ($("idBARA").checked == true)
		{
			// STEP: draw Temperature plot
			if ($("idTemperature").checked == true)
			{
				let elColor = $("idTemperatureColor");
				DrawCurve(aPointsTemp, fTemperatureMin, fTemperatureMax, elColor.value);
			}
			
			// STEP: draw Pressure plot
			if ($("idPressure").checked == true)
			{
				let Selection = $("idPressureDimSelector").value;
			
				let fScaler = 1;
				if (Selection == "kPa")
					fScaler = 10;
			
				elColor = $("idPressureColor");
				DrawCurve(aPointsBaro, fPressureMin*fScaler, fPressureMax*fScaler, elColor.value);
			}
		}
		
		if ($("idFOA").checked == true)
		{
			// STEP: draw Thermocouple plot
			if ($("idThermocouple").checked == true)
			{
				elColor = $("idThermocoupleColor");
				DrawCurve(aPointsThermocouple, fThermocoupleMin, fThermocoupleMax, elColor.value);
			}
			
			// STEP: draw ThermistorV plot
			if ($("idThermistorV").checked == true)
			{
				elColor = $("idThermistorVColor");
				DrawCurve(aPointsThermistorV, fThermistorVMin, fThermistorVMax, elColor.value);
			}
			
			// STEP: draw ThermistorR plot
			if ($("idThermistorR").checked == true)
			{
				elColor = $("idThermistorRColor");
				DrawCurve(aPointsThermistorR, fThermistorRMin, fThermistorRMax, elColor.value);
			}
			
			// STEP: draw Flux plot
			if ($("idFlux").checked == true)
			{
				elColor = $("idFluxColor");
				DrawCurve(aPointsFlux, fFluxMin, fFluxMax, elColor.value);
			}
		}
		
	}
