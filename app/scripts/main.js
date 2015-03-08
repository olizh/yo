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

	var appTitle = '商学院';

	var courseStatus = {
		action: 'next',
		length: 0,
		current: 0,
		button: '开始',
		buttonDisable: false
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

	function openCourse(courseId, courseTitle) {
		var id = courseId.replace(/^.*\/course\//g, '');
		var apiUrl = 'api/course' + id + '.json'; 
		document.getElementById('n-course-inner').innerHTML = '';
		document.getElementById('n-header-title').innerHTML = courseTitle;
		document.getElementById('n-course-button').innerHTML = '开始';
		document.body.className = 'n-in-course';
		$.get(apiUrl, function(data) {
			var courseHTML = '';
			var courseImage = '';
			courseStatus.length = 0;
			if (data.image && data.image !== '') {
				//courseImage = '<img src="' + data.image +'">';
				courseImage = '<div class="n-home-course-container"><div class="n-home-course-inner" style="background-image: url(' + data.image + ')"></div></div>';
			}
			courseHTML = '<div class="n-page n-page-start n-page-on"><div class="n-page-inner">' + courseImage + '<h1 class="n-page-title">' + data.title + '</h1><div class="n-page-lead">' + data.lead + '</div></div></div>';
			courseStatus.length += 1;
			$.each(data.content, function(entryIndex, entry) {
				var pageTitle = '';
				var pageMain = '';
				var pageOption = '';
				if (entry.pageType === 'quiz') {
					pageTitle = '<div class="n-page-title">' + entry.title + '</div>';
					pageMain = '<div class="n-page-main">' + entry.question + '</div>'; 
					pageOption = '<div class="n-option" value=1>' + entry.rightanswer + '</div>';
					$.each(entry.wronganswer, function(itemIndex, item) {
						pageOption += '<div class="n-option">' + item + '</div>';
					});
					pageOption = '<div class="n-option-container">' + pageOption + '</div>'; 
					courseHTML += '<div class="n-page n-page-quiz"><div class="n-page-inner">' + pageTitle + pageMain + pageOption + '</div></div>';
				}
				courseStatus.length += 1;
			});
			courseHTML += '<div class="n-page n-page-last"><div class="n-page-inner">Last Page</div></div>';
			courseStatus.length += 1;
			document.getElementById('n-course-inner').innerHTML = courseHTML;
			openPage(0);
		});
	}

	function openPage(page) {
		$('#n-course-inner .n-page').removeClass('n-page-on').removeClass('n-page-next').removeClass('n-page-prev');
		$('#n-course-inner .n-page').eq(courseStatus.current).addClass('n-page-on');
		if (courseStatus.current > 0) {
			$('#n-course-inner .n-page').eq(courseStatus.current - 1).addClass('n-page-prev');
		} else if (courseStatus.current === 0) {
			$('#n-course-inner .n-page').eq(courseStatus.length-1).addClass('n-page-prev');
		} 

		if (courseStatus.current === courseStatus.length -1) {
			$('#n-course-inner .n-page').eq(0).addClass('n-page-next');
		} else if (courseStatus.current < courseStatus.length -1) {
			$('#n-course-inner .n-page').eq(courseStatus.current + 1).addClass('n-page-next');
		}
	}

	function courseAction(action) {
		if (action === 'next') {
			if (courseStatus.current === courseStatus.length -1) {//last page
				courseStatus.current = 0;
			} else if (courseStatus.current < courseStatus.length -1) {
				courseStatus.current += 1; 
			}
			openPage(courseStatus.current);
		}
	}

	// back function
	$('body').on('click', '.n-header__back', function(){
		document.body.className = '';
		document.getElementById('n-header-title').innerHTML = appTitle; 
	});

	// click into a course
	$('body').on('click', '.n-course-link', function(){
		openCourse(this.href, this.title);
		return false;
	});

	$('body').on('click', '#n-course-button', function(){
		courseAction(courseStatus.action);
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
	    		homeContent += '<a href="course/' + entry.id + '" title="' + entry.title + '" class="n-course-link"><div class="' + containerClass + '"><div class="' + innerClass + '" /*style="background-image: url(' +  entry.image + '?'+ entry.id + ')"*/><div class="n-home-course-title">' + entry.title + entryIndex + '</div></div></div></a>' + clearFloat;
		        startScreen.className = 'start-screen fadeOut animated running';
	        });
	        document.getElementById('home-content').innerHTML = homeContent;
		    // Fast Click
			var scroller = new FTScroller(document.getElementById('home-content-scroller'), verticalScrollOpts);
	        setTimeout (function(){
	        	startScreen.parentNode.removeChild(startScreen);
	        },1000);
    	}
    });

})(); 