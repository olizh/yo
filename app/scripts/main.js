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


	var courseStatus = {
		action: 'next',
		length: 0,
		current: 0,
		buttonDisable: false,
		score: 0,
		fullScore: 0,
		passMark: 60
	};

	var captions = {
		language: 'en',
		text: {
			appTitle: {
				en: 'ACADEMY',
				ch: '商学院'
			},
			start: {
				en: 'START',
				ch: '开始'
			},
			back: {
				en: 'BACK',
				ch: '返回'
			},
			confirm: {
				en: 'CONFIRM',
				ch: '确定'
			},
			next: {
				en: 'NEXT',
				ch: '继续'
			},
			review: {
				en: 'REVIEW',
				ch: '重温'
			}
		}
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

	function getCaption(captionName) {
		return captions.text[captionName][captions.language];
	}


	function openCourse(courseId, courseTitle) {
		var id = courseId.replace(/^.*\/course\//g, '');
		var apiUrl = 'api/course' + id + '.json'; 
		document.getElementById('n-course-inner').innerHTML = '';
		document.getElementById('n-header-title').innerHTML = courseTitle;
		document.getElementById('n-course-button').innerHTML = getCaption('start');
		document.body.className = 'n-in-course';
		$.get(apiUrl, function(data) {
			var courseHTML = '';
			var courseImage = '';
			var coursePassIntro = '';
			courseStatus.length = 0;
			courseStatus.score = 0;
			courseStatus.fullScore = 0; 
			if (data.image && data.image !== '') {
				//courseImage = '<img src="' + data.image +'">';
				courseImage = '<div class="n-home-course-container"><div class="n-home-course-inner" style="background-image: url(' + data.image + ')"></div></div>';
			}
			if (data.passMark && data.passMark !== '') {
				courseStatus.passMark = parseInt(data.passMark, 10) || 60; 
			}
			coursePassIntro = '<p>需要获得' + courseStatus.passMark + '%的分数过关</p>'; 
			courseHTML = '<div class="n-page n-page-start n-page-on"><div class="n-page-inner">' + courseImage + '<h1 class="n-page-title">' + data.title + '</h1><div class="n-page-lead">' + data.lead + coursePassIntro + '</div></div></div>';
			courseStatus.length += 1;
			$.each(data.content, function(entryIndex, entry) {
				var pageTitle = '';
				var pageMain = '';
				var pageOption = '';
				var pageValue = 0; 
				if (entry.pageType === 'quiz') {
					pageTitle = '<h3 class="n-page-title">' + entry.title + '</h3>';
					pageMain = '<div class="n-page-lead">' + entry.question + '</div>'; 
					pageValue = parseInt(entry.value, 10) || 1;
					pageOption = '<div class="n-option" value=' + pageValue + '>' + entry.rightanswer + '</div>';
					$.each(entry.wronganswer, function(itemIndex, item) {
						pageOption += '<div class="n-option">' + item + '</div>';
					});
					pageOption = '<div class="n-option-container">' + pageOption + '</div>'; 
					courseHTML += '<div class="n-page n-page-quiz"><div class="n-page-inner">' + pageTitle + pageMain + pageOption + '</div></div>';
				}
				courseStatus.fullScore += pageValue;
				courseStatus.length += 1;
			});
			courseHTML += '<div class="n-page n-page-last"><div class="n-page-inner"><div class="n-page-score"></div><div class="n-page-lead></div></div></div>';
			courseStatus.length += 1;
			document.getElementById('n-course-inner').innerHTML = courseHTML;
			openPage(0);
		});
	}

	function openPage(page) {
		var allPages = $('#n-course-inner .n-page');
		var currentPage = allPages.eq(page);
		var courseButton = $('#n-course-button');
		var scoreRate = 0;
		courseStatus.current = page;
		allPages.removeClass('n-page-on').removeClass('n-page-next').removeClass('n-page-prev');
		currentPage.addClass('n-page-on');
		if (page > 0) {
			allPages.eq(courseStatus.current - 1).addClass('n-page-prev');
		} else if (courseStatus.current === 0) {
			allPages.eq(courseStatus.length-1).addClass('n-page-prev');
		}
		if (page === courseStatus.length -1) {
			// display scores and feedbacks in last page
			allPages.eq(0).addClass('n-page-next');
			// score displays once
			if (courseStatus.fullScore > 0 && currentPage.hasClass('done') === false) {
				scoreRate = 100 * courseStatus.score/courseStatus.fullScore;
				scoreRate = Math.round(scoreRate);
				currentPage.find('.n-page-score').html(scoreRate);
				if (scoreRate >= courseStatus.passMark) {
					currentPage.find('.n-page-score').addClass('good animated running infinite pulse');
				} else {
					currentPage.find('.n-page-score').addClass('bad animated running shake');
				}
			}
			currentPage.addClass('done');
		} else if (courseStatus.current < courseStatus.length -1) {
			allPages.eq(courseStatus.current + 1).addClass('n-page-next');
		}
		if (currentPage.hasClass('n-page-quiz') === true && currentPage.hasClass('done') === false) {
			courseButton.html(getCaption('confirm'));
			courseButton.addClass('disabled');
			courseStatus.buttonDisable = true; 
			courseStatus.action = 'confirm';
		} else {
			courseButton.html((page === courseStatus.length -1) ? getCaption('review') : (page === 0) ? getCaption('start') : getCaption('next'));
			courseButton.removeClass('disabled');
			courseStatus.buttonDisable = false; 
			courseStatus.action = 'next';
		}
	}

	function courseAction(action) {
		if (courseStatus.buttonDisable === true) {
			return;
		}
		var currentPage = $('.n-page').eq(courseStatus.current);
		var currentOption;
		var currentValue;
		if (action === 'next') {
			if (courseStatus.current === courseStatus.length -1) {//last page
				courseStatus.current = 0;
			} else if (courseStatus.current < courseStatus.length -1) {
				courseStatus.current += 1; 
			}
			openPage(courseStatus.current);
		} else if (action === 'confirm') {
			currentOption = currentPage.find('.n-option.selected');
			currentValue = parseInt(currentOption.attr('value'), 10) || 0;
			if (currentOption.attr('value') >= 1) {
				courseStatus.score += currentValue; 
				currentOption.addClass('is-correct animated running tada');
			} else {
				currentOption.addClass('is-wrong animated running shake');
				currentPage.find('.n-option[value]').addClass('is-correct');
			}
			currentPage.addClass('done');
			courseStatus.action = 'next';
			document.getElementById('n-course-button').innerHTML = getCaption('next');
		}
	}

	// back function
	$('body').on('click', '.n-header__back', function(){
		document.body.className = '';
		document.getElementById('n-header-title').innerHTML = getCaption('appTitle'); 
	});

	// click into a course
	$('body').on('click', '.n-course-link', function(){
		openCourse(this.href, this.title);
		return false;
	});

	$('body').on('click', '#n-course-button', function(){
		courseAction(courseStatus.action);
	});

	$('body').on('click', '.n-option', function(){
		if ($(this).parentsUntil('n-page').parent().hasClass('done') === true) {
			return;
		}
		$(this).parent().find('.n-option').removeClass('selected');
		$(this).addClass('selected');
		var courseButton = $('#n-course-button');
		courseButton.html(getCaption('confirm'));
		courseButton.removeClass('disabled');
		courseStatus.action = 'confirm';
		courseStatus.buttonDisable = false;
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

	document.getElementById('n-header-title').innerHTML = getCaption('appTitle'); 
	document.getElementById('n-header__back').innerHTML = getCaption('back'); 
})(); 