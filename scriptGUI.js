	"use strict";

    var $  = function( id ) { return document.getElementById( id ); };
    var $F = function( id ) { return parseFloat(document.getElementById( id ).value); };

	let c = $("FrontCanvas");
	let ctx = c.getContext("2d");
	
	var idInterval       = -1;	// update interval identifier
	var idIntervalPing   = -1;	// ping interval identifier
	
	var iTimeMSstart = Date.now();
	var iSecondsInCompressedRange = 100;	// shortcut describing the number of seconds held by compressed part of the graph
	var iTimeMSCompressedThreshold;			// range where iStepCompressed is applied during rendering
	var iTimeMSTotalThreshold;				// after exeeding the threshold the values bacome packed into copression range
	var iStepCompressed, iStepNormal;

	// arrays of sampled channels
	var aPointsTemp  = [];
	var aPointsBaro  = [];
	var aPointsTemp2 = [];
	var aPointsBaro2 = [];
	var aPointsThermocouple = [];
	var aPointsThermistorV = [];
	var aPointsThermistorR = [];
	var aPointsFlux = [];
	
	var iLeftMargin, iRightMargin;
	var iTopMargin,  iBottomMargin;
	
	var iLeftAbs, iRightAbs;
	var iTopAbs,  iBottomAbs;
	
	var iStepH, iStepV;

	// Initial values (values in GUI may be unfinished or cached by browser, here we store operational values)
	var strPressureDim   = "kPa";
	var strPressureDim2  = "kPa";

	var fTemperatureMin  = -30;
	var fTemperatureMax  = 70;
	
	var fTemperatureMin2 = -30;
	var fTemperatureMax2 = 70;

	var fPressureMin     = 0;
	var fPressureMax     = 200;
	
	var fPressureMin2    = 0;
	var fPressureMax2    = 200;

	var fThermocoupleMin = 0;
	var fThermocoupleMax = 20;
	
	var fThermistorVMin  = 1.5;
	var fThermistorVMax  = 2.0;
	
	var fThermistorRMin  = 150;
	var fThermistorRMax  = 200;
	
	var fFluxMin         = 0;
	var fFluxMax         = 3000;
	
	
	// GUI callback triggered on pressure dimension change
	function PressureDimensionChanged(object)
	{
		strPressureDim = object.value;
		
		let fVal;
		if (strPressureDim == "mBar")
		{
			fVal = $("idPressureMin").value;
			$("idPressureMin").value = fVal*10;
			fPressureMin = fVal*10;
			
			fVal = $("idPressureMax").value;
			$("idPressureMax").value = fVal*10;
			fPressureMax = fVal*10;
			
			$("pressureDimMin").innerHTML = 'mBar';
			$("pressureDimMax").innerHTML = 'mBar';
		}
		else
		{
			fVal = $("idPressureMin").value;
			$("idPressureMin").value = fVal/10;
			fPressureMin = fVal/10;
			
			fVal = $("idPressureMax").value;
			$("idPressureMax").value = fVal/10;
			fPressureMax = fVal/10;
			
			$("pressureDimMin").innerHTML = 'kPa';
			$("pressureDimMax").innerHTML = 'kPa';
		}
		
		DrawPlot();
	}
	
	// GUI callback triggered on pressure dimension change
	function PressureDimensionChanged2(object)
	{
		strPressureDim2 = object.value;
		
		let fVal;
		if (strPressureDim2 == "mBar")
		{
			fVal = $("idPressureMin2").value;
			$("idPressureMin2").value = fVal*10;
			fPressureMin2 = fVal*10;
			
			fVal = $("idPressureMax2").value;
			$("idPressureMax2").value = fVal*10;
			fPressureMax2 = fVal*10;
			
			$("pressureDimMin2").innerHTML = 'mBar';
			$("pressureDimMax2").innerHTML = 'mBar';
		}
		else
		{
			fVal = $("idPressureMin2").value;
			$("idPressureMin2").value = fVal/10;
			fPressureMin2 = fVal/10;
			
			fVal = $("idPressureMax2").value;
			$("idPressureMax2").value = fVal/10;
			fPressureMax2 = fVal/10;
			
			$("pressureDimMin2").innerHTML = 'kPa';
			$("pressureDimMax2").innerHTML = 'kPa';
		}
		
		DrawPlot();
	}

	// On page load callback
	async function OnInit()
	{
        // wait to be able to calulcate GUI dependant variables correctly
        await DisableInactiveDevices();
        
		InitGUIparamsFromData();
		
		// handles the case when page remembers checkbox selection after refresh
		CalcGUIcoefficients();

		idIntervalPing = setInterval(PingHTTPserver, 2000);
	}


	// GUI init
	function InitGUIparamsFromData()
	{
		$("idPressureDimSelector").value  = strPressureDim;
		$("idPressureDimSelector2").value = strPressureDim2;

		$("idTemperatureMin").value  = fTemperatureMin;
		$("idTemperatureMax").value  = fTemperatureMax;

		$("idTemperatureMin2").value = fTemperatureMin2;
		$("idTemperatureMax2").value = fTemperatureMax2;

		$("idPressureMin").value     = fPressureMin;
		$("idPressureMax").value     = fPressureMax;

		$("idPressureMin2").value    = fPressureMin2;
		$("idPressureMax2").value    = fPressureMax2;

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
		
		fTemperatureMin2 = $F("idTemperatureMin2");
		fTemperatureMax2 = $F("idTemperatureMax2");

		fPressureMin     = $F("idPressureMin");
		fPressureMax     = $F("idPressureMax");

		fPressureMin2    = $F("idPressureMin2");
		fPressureMax2    = $F("idPressureMax2");

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
	
	function CalcGUIcoefficients()
	{
		let x;
		
		x = document.getElementsByClassName("BARAclass");
		if ($("idBARA").checked == false)
		{
			for (let i = 0; i < x.length; i++)
				x[i].style.display = "none";
		}
		else {
			for (let i = 0; i < x.length; i++)
				x[i].style.display = "table-row";
		}

		x = document.getElementsByClassName("BARAclass2");
		if ($("idBARA2").checked == false)
		{
			for (let i = 0; i < x.length; i++)
				x[i].style.display = "none";
		}
		else {
			for (let i = 0; i < x.length; i++)
				x[i].style.display = "table-row";
		}

		x = document.getElementsByClassName("FOAclass");
		if ($("idFOA").checked == false)
		{
			for (let i = 0; i < x.length; i++)
				x[i].style.display = "none";

		}
		else {
			for (let i = 0; i < x.length; i++)
				x[i].style.display = "table-row";
		}

        if (($("idBARA").checked == true) && ($("idBARA2").checked == true))
            iLeftMargin = 310;
        else
            iLeftMargin = (($("idBARA").checked == true) || ($("idBARA2").checked == true)) ? 150 : 50;
		iRightMargin  = ($("idFOA").checked  == true) ? 340 : 40;
		iTopMargin    = 50;
		iBottomMargin = 110;

		iLeftAbs   = iLeftMargin;
		iRightAbs  = c.width-iRightMargin;
		iTopAbs    = iTopMargin;
		iBottomAbs = c.height-iBottomMargin;
		
		iStepH = (iRightAbs - iLeftAbs)/16;		// compression range of 10 + 6 subintervals
		iStepV = (iBottomAbs - iTopAbs)/10;

		DrawPlot();
	}
	

	function StartAutoUpdate()
	{
		if (idInterval != -1) {
			alert("Monitoring is already in progress");
			return;
		}

		if ((aPointsTemp.length || aPointsThermocouple.length) &&
		    (confirm("Previous data will be lost. Continue?") == false)) return;
		    
		if ( ($("idBARA").checked  == false) &&
             ($("idBARA2").checked == false) &&
             ($("idFOA").checked   == false) )
        {
			alert("No groups selected for monitoring");
			return;
		}
		    
		// prevent "group" collapse/expand during monitoring as selection effects sampled channels
		$("idBARA").disabled  = true;
		$("idBARA2").disabled = true;
		$("idFOA").disabled   = true;
		    
		aPointsTemp  = [];
		aPointsBaro  = [];
		aPointsTemp2 = [];
		aPointsBaro2 = [];
		aPointsThermocouple = [];
		aPointsThermistorV  = [];
		aPointsThermistorR  = [];
		aPointsFlux  = [];
		
		idInterval = setInterval(fetchDataAsync, 1000);
		
		iTimeMSstart               = Date.now();
		iTimeMSCompressedThreshold = iTimeMSstart + 100*1000;
		iTimeMSTotalThreshold      = iTimeMSstart + 160*1000;
		iSecondsInCompressedRange  = 100;
	}
	
	function StopAutoUpdate()
	{
		if (idInterval != -1)
		{
			clearInterval(idInterval);
			idInterval = -1;
			
			$("idBARA").disabled  = false;
			$("idBARA2").disabled = false;
			$("idFOA").disabled   = false;
		}
	}
	

	function DrawRangeMarksText()
	{
		ctx.font = "bold 20px serif";
		let fCurrent;
		let fDelta;

		if ( ($("idBARA").checked == true) && ($("idBARA2").checked == true))
		{
			// Temperature
			ctx.fillStyle = $("idTemperatureColor").value;
			ctx.fillText("°C", 10, c.height-45);
			ctx.fillText("T",  18, c.height-15);
				
			//ctx.fillStyle = "black";
			
			fCurrent = fTemperatureMin;
			fDelta  = (fTemperatureMax - fTemperatureMin)/10;
			for (let i=0; i<=10; i++, fCurrent = fCurrent + fDelta)
			{
				ctx.fillText(Number(fCurrent.toFixed(1)), 10, iBottomAbs - 5 - i*iStepV);
			}
			
			// Pressure
			ctx.fillStyle = $("idPressureColor").value;
			if (strPressureDim == "kPa")
				ctx.fillText("kPa", 70, c.height-45);
			else
				ctx.fillText("mBar", 70, c.height-45);
			ctx.fillText("Ps", 70, c.height-15);
			
			//ctx.fillStyle = "black";
			
			fCurrent = fPressureMin;
			fDelta  = (fPressureMax - fPressureMin)/10;
			for (let i=0; i<=10; i++, fCurrent = fCurrent + fDelta)
			{
				ctx.fillText(Number(fCurrent.toFixed(1)), 70, iBottomAbs - 5 - i*iStepV);
			}

            // idBARA2------------------------------------------------------------

			// Temperature
			ctx.fillStyle = $("idTemperatureColor2").value;
			ctx.fillText("°C", 160, c.height-45);
			ctx.fillText("T",  168, c.height-15);
				
			//ctx.fillStyle = "black";
			
			fCurrent = fTemperatureMin2;
			fDelta  = (fTemperatureMax2 - fTemperatureMin2)/10;
			for (let i=0; i<=10; i++, fCurrent = fCurrent + fDelta)
			{
				ctx.fillText(Number(fCurrent.toFixed(1)), 160, iBottomAbs - 5 - i*iStepV);
			}
			
			// Pressure
			ctx.fillStyle = $("idPressureColor2").value;
			if (strPressureDim2 == "kPa")
				ctx.fillText("kPa", 230, c.height-45);
			else
				ctx.fillText("mBar", 230, c.height-45);
			ctx.fillText("Ps", 230, c.height-15);
			
			//ctx.fillStyle = "black";
			
			fCurrent = fPressureMin2;
			fDelta  = (fPressureMax2 - fPressureMin2)/10;
			for (let i=0; i<=10; i++, fCurrent = fCurrent + fDelta)
			{
				ctx.fillText(Number(fCurrent.toFixed(1)), 230, iBottomAbs - 5 - i*iStepV);
			}
        }
		else if ($("idBARA").checked == true)
		{
			// Temperature
			ctx.fillStyle = $("idTemperatureColor").value;
			ctx.fillText("°C", 10, c.height-45);
			ctx.fillText("T",  18, c.height-15);
				
			//ctx.fillStyle = "black";
			
			fCurrent = fTemperatureMin;
			fDelta  = (fTemperatureMax - fTemperatureMin)/10;
			for (let i=0; i<=10; i++, fCurrent = fCurrent + fDelta)
			{
				ctx.fillText(Number(fCurrent.toFixed(1)), 10, iBottomAbs - 5 - i*iStepV);
			}
			
			// Pressure
			ctx.fillStyle = $("idPressureColor").value;
			if (strPressureDim == "kPa")
				ctx.fillText("kPa", 70, c.height-45);
			else
				ctx.fillText("mBar", 70, c.height-45);
			ctx.fillText("Ps", 70, c.height-15);
			
			//ctx.fillStyle = "black";
			
			fCurrent = fPressureMin;
			fDelta  = (fPressureMax - fPressureMin)/10;
			for (let i=0; i<=10; i++, fCurrent = fCurrent + fDelta)
			{
				ctx.fillText(Number(fCurrent.toFixed(1)), 70, iBottomAbs - 5 - i*iStepV);
			}
		}
        else if ($("idBARA2").checked == true)
		{
			// Temperature
			ctx.fillStyle = $("idTemperatureColor2").value;
			ctx.fillText("°C", 10, c.height-45);
			ctx.fillText("T",  18, c.height-15);
				
			//ctx.fillStyle = "black";
			
			fCurrent = fTemperatureMin2;
			fDelta  = (fTemperatureMax2 - fTemperatureMin2)/10;
			for (let i=0; i<=10; i++, fCurrent = fCurrent + fDelta)
			{
				ctx.fillText(Number(fCurrent.toFixed(1)), 10, iBottomAbs - 5 - i*iStepV);
			}
			
			// Pressure
			ctx.fillStyle = $("idPressureColor2").value;
			if (strPressureDim2 == "kPa")
				ctx.fillText("kPa", 70, c.height-45);
			else
				ctx.fillText("mBar", 70, c.height-45);
			ctx.fillText("Ps", 70, c.height-15);
			
			//ctx.fillStyle = "black";
			
			fCurrent = fPressureMin2;
			fDelta  = (fPressureMax2 - fPressureMin2)/10;
			for (let i=0; i<=10; i++, fCurrent = fCurrent + fDelta)
			{
				ctx.fillText(Number(fCurrent.toFixed(1)), 70, iBottomAbs - 5 - i*iStepV);
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
			for (let i=0; i<=10; i++, fCurrent = fCurrent + fDelta)
			{
				ctx.fillText(Number(fCurrent.toFixed(1)), c.width - 310, iBottomAbs - 5 - i*iStepV);
			}
			
			// Thermocouple mV
			ctx.fillStyle = $("idThermocoupleColor").value;
			ctx.fillText("mV", c.width - 220, c.height-45);
			ctx.fillText("ThC", c.width - 220, c.height-15);
			
			//ctx.fillStyle = "black";
			
			fCurrent = fThermocoupleMin;
			fDelta  = (fThermocoupleMax - fThermocoupleMin)/10;
			for (let i=0; i<=10; i++, fCurrent = fCurrent + fDelta)
			{
				ctx.fillText(Number(fCurrent.toFixed(1)), c.width - 220, iBottomAbs - 5 - i*iStepV);
			}
			
			// Thermoresistor Ohm
			ctx.fillStyle = $("idThermistorRColor").value;
			ctx.fillText("Ω",   c.width - 150, c.height-45);
			ctx.fillText("ThR", c.width - 150, c.height-15);
			
			//ctx.fillStyle = "black";
			
			fCurrent = fThermistorRMin;
			fDelta  = (fThermistorRMax - fThermistorRMin)/10;
			for (let i=0; i<=10; i++, fCurrent = fCurrent + fDelta)
			{
				ctx.fillText(Number(fCurrent.toFixed(1)), c.width - 150, iBottomAbs - 5 - i*iStepV);
			}
			
			// Thermistor voltage
			ctx.fillStyle = $("idThermistorVColor").value;
			ctx.fillText("V",   c.width - 70, c.height-45);
			ctx.fillText("ThV", c.width - 70, c.height-15);
			
			//ctx.fillStyle = "black";
			
			fCurrent = fThermistorVMin;
			fDelta  = (fThermistorVMax - fThermistorVMin)/10;
			for (let i=0; i<=10; i++, fCurrent = fCurrent + fDelta)
			{
				ctx.fillText(fCurrent.toFixed(2), c.width - 70, iBottomAbs - 5 - i*iStepV);;
			}
		}
	}
	
	function DrawCurve(aPoints, fValMin, fValMax, color)
	{
		if (aPoints.length < 1) return;
		
		let fPxPerUnitY = (c.height - iTopMargin - iBottomMargin)/(fValMax - fValMin);
		
		// nice touch
		if (!isFinite(fPxPerUnitY)) return;

		let iX = iLeftAbs;
		let iY = iBottomAbs - fPxPerUnitY * (aPoints[0].value - fValMin);
		
		iStepNormal     =  iStepH/10;
		iStepCompressed = (iStepH*10)/iSecondsInCompressedRange;

		ctx.lineWidth = 3;
		ctx.beginPath();

		ctx.moveTo(iX, iY);
		for (let i=0; i < aPoints.length-1; i++)
		{
			if (aPoints[i].time < iTimeMSCompressedThreshold)
			{
				iX = iLeftAbs   + iStepCompressed*(aPoints[i].time - iTimeMSstart)/1000;
				iY = iBottomAbs - fPxPerUnitY*    (aPoints[i].value - fValMin);
				
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
					iX = iLeftAbs   + iStepH*10 + iStepNormal*(aPoints[i].time - iTimeMSCompressedThreshold)/1000;
					iY = iBottomAbs -             fPxPerUnitY*(aPoints[i].value - fValMin);
					
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
		DrawRangeMarksText();


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
		
		 
		let elColor;
		
		if ($("idBARA").checked == true)
		{
			// STEP: draw Temperature plot
			if ($("idTemperature").checked == true)
			{
				elColor = $("idTemperatureColor");
				DrawCurve(aPointsTemp, fTemperatureMin, fTemperatureMax, elColor.value);
			}
			
			// STEP: draw Pressure plot
			if ($("idPressure").checked == true)
			{
				let fScaler = (strPressureDim == "kPa") ? 10 : 1;
			
				elColor = $("idPressureColor");
				DrawCurve(aPointsBaro, fPressureMin*fScaler, fPressureMax*fScaler, elColor.value);
			}
		}
        
		if ($("idBARA2").checked == true)
		{
			// STEP: draw Temperature plot
			if ($("idTemperature2").checked == true)
			{
				elColor = $("idTemperatureColor2");
				DrawCurve(aPointsTemp2, fTemperatureMin2, fTemperatureMax2, elColor.value);
			}
			
			// STEP: draw Pressure plot
			if ($("idPressure2").checked == true)
			{
				let fScaler = (strPressureDim2 == "kPa") ? 10 : 1;

				elColor = $("idPressureColor2");
				DrawCurve(aPointsBaro2, fPressureMin2*fScaler, fPressureMax2*fScaler, elColor.value);
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
