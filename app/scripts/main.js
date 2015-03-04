/* jshint devel:true */
(function(){
	'use strict';

	var verticalScrollOpts = {
	    scrollingX: false,
	    bouncing: false,
	    snapping: false,
	    scrollbars: true,
	    scrollBoundary: 8,
	    updateOnChanges: true,
	    updateOnWindowResize: true,
	    windowScrollingActiveFlag: 'gFTScrollerActive'
	};

	// if url has isInSWIFT
	// display extra 20px 
	// at the top for native app status bar
	if (location.href.indexOf('isInSWIFT') > 0) {
		document.getElementsByTagName('HTML')[0].classList.add('is-in-swift');
	}

	// initiate fast click
	if ('addEventListener' in document) {
	    document.addEventListener('DOMContentLoaded', function() {
	        FastClick.attach(document.body);
	    }, false);
	}

	// bring out left and right menu
	$('body').on('click', '.n-header__left, .n-header__right', function(){
		if ($(this).hasClass('n-header__left') === true) {
			alert ('left menu!');
		} else {
			alert ('right menu');
		}
	});

	// click into a course
	$('body').on('click', '.n-course-link', function(){
			alert (this.href);
			return false;
	});

	// get JSON data for home page
    $.get('api/courses.json', function(data) {
    	var startScreen = document.getElementById('start-screen'),
    		homeContent = '';
    	if (typeof data === 'object') {
	    	$.each(data, function(entryIndex, entry) {
	    		var bgClass,
	    			innerClass,
	    			sClass,
	    			sMod,
	    			mClass,
	    			mMod,
	    			lClass,
	    			lMod,
	    			containerClass,
	    			clearFloat;
	    		bgClass = 'n-home-course-green';
	    		innerClass = 'n-home-course-inner ' + bgClass;
	    		sMod = entryIndex % 8;
	    		sClass = 's-' + sMod;
	    		mMod = entryIndex % 16;
	    		mClass = 'm-' + mMod;
	    		lMod = entryIndex % 16;
	    		lClass = 'l-' + lMod;
	    		containerClass = 'n-home-course-container ' + sClass + ' ' + mClass + ' ' + lClass;
	    		clearFloat = '<div class="clearfloat ' + sClass + ' ' + mClass + ' ' + lClass + '"></div>'; 
	    		homeContent += '<a href="course/' + entry.id + '" class="n-course-link"><div class="' + containerClass + '"><div class="' + innerClass + '" /*style="background-image: url(' +  entry.image + '?'+ entry.id + ')"*/><div class="n-home-course-title">' + entry.title + entryIndex + '</div></div></div></a>' + clearFloat;
				setTimeout (function () {
			        startScreen.className = 'start-screen fadeOut animated running';
			    }, 4000);
	        });
	        document.getElementById('home-content').innerHTML = homeContent;
		    // Fast Click
			var scroller = new FTScroller(document.getElementById('home-content-scroller'), verticalScrollOpts);
	        setTimeout (function(){
	        	startScreen.parentNode.removeChild(startScreen);
	        },5000);
    	}
    });



})(); 