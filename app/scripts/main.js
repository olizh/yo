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
		passMark: 60,
		wrongPoints: [],
		rightPoints: [],
		nextSession: '',
		currentSession: ''
	};

	var captions = {
		language: 'ch',
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
			},
			passIntro1: {
				en: 'You Need ',
				ch: '需要'
			},
			passIntro2: {
				en: '% to Pass',
				ch: '%的分数过关'
			},
			retry: {
				en: 'RETRY',
				ch: '重试'
			},
			share: {
				en: 'SHARE',
				ch: '分享'
			},
			nextSession: {
				en: 'Next Session',
				ch: '下一节'
			},
			scoreIntro: {
				en: 'You scored ',
				ch: '您答对'
			},
			trueOrFalse: {
				en: 'True or False',
				ch: '判断'
			},
			trueStatement: {
				en: 'True',
				ch: '正确'
			},
			falseStatement: {
				en: 'False',
				ch: '错误'
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
	
	function backButton() {
		document.body.className = '';
		document.getElementById('n-header-title').innerHTML = getCaption('appTitle'); 
	}

	function shuffleArray(array) {
	    for (var i = array.length - 1; i > 0; i--) {
	        var j = Math.floor(Math.random() * (i + 1));
	        var temp = array[i];
	        array[i] = array[j];
	        array[j] = temp;
	    }
	    return array;
	}

	function openPage(page) {
		var allPages = $('#n-course-inner .n-page');
		var currentPage = allPages.eq(page);
		var courseButton = $('#n-course-button');
		var scoreRate = 0;
		var scoreClass = '';
		var points = '';
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
				courseStatus.scoreRate = scoreRate;
				if (scoreRate >= courseStatus.passMark) {
					scoreClass = 'good';
				} else {
					scoreClass = 'bad';
				}
				$.each(courseStatus.wrongPoints, function(entryIndex, entry) {
					points += '<li class="n-wrong-point">' + entry + '</li>';
				});
				$.each(courseStatus.rightPoints, function(entryIndex, entry) {
					points += '<li class="n-right-point">' + entry + '</li>';
				});
				points = '<ul>' + points + '</ul>';
				currentPage.find('.n-page-title').html(getCaption('scoreIntro') + '<span class="' + scoreClass + '">' + scoreRate + '%</span>');
				currentPage.find('.n-page-lead').html(points);
			}
			currentPage.addClass('done');
		} else if (courseStatus.current < courseStatus.length -1) {
			allPages.eq(courseStatus.current + 1).addClass('n-page-next');
		}
		// handle courseButton
		if (page === courseStatus.length -1) {
			courseButton.removeClass('disabled');
			courseStatus.buttonDisable = false; 
			if (courseStatus.scoreRate >= courseStatus.passMark) {
				courseStatus.action = 'nextSession';
				courseButton.html(getCaption('nextSession'));
			} else {
				courseStatus.action = 'retry';
				courseButton.html(getCaption('retry'));
			}
		} else if ((currentPage.hasClass('n-page-quiz') === true || currentPage.hasClass('n-page-true-false') === true) && currentPage.hasClass('done') === false) {
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

	function openSession(sessionId, sessionTitle) {
		var id = sessionId.replace(/^.*\/course\//g, '');
		var apiUrl = 'api/session' + id + '.json';
		document.getElementById('n-course-inner').innerHTML = '';
		if (typeof sessionTitle !== undefined) {
			document.getElementById('n-header-title').innerHTML = sessionTitle;
		}
		courseStatus.currentSession = id;
		document.getElementById('n-course-button').innerHTML = getCaption('start');
		document.body.className = 'n-in-course';
		$.get(apiUrl, function(data) {
			var courseHTML = '';
			var courseImage = '';
			var coursePassIntro = '';
			var courseUrl = 'api/course' + data.course + '.json';
			//initialize courseStatus
			courseStatus.length = 0;
			courseStatus.score = 0;
			courseStatus.fullScore = 0;
			courseStatus.wrongPoints = [];
			courseStatus.rightPoints = [];
			document.getElementById('n-header-title').innerHTML = data.title;
			if (data.image && data.image !== '') {
				//courseImage = '<img src="' + data.image +'">';
				courseImage = '<div class="n-home-course-container"><div class="n-home-course-inner" style="background-image: url(' + data.image + ')"></div></div>';
			}
			if (data.passMark && data.passMark !== '') {
				courseStatus.passMark = parseInt(data.passMark, 10) || 60; 
			}
			coursePassIntro = '<p>' + getCaption('passIntro1') + courseStatus.passMark + getCaption('passIntro2') +'</p>'; 
			courseHTML = '<div class="n-page n-page-start n-page-on"><div class="n-page-inner">' + courseImage + '<h1 class="n-page-title">' + data.title + '</h1><div class="n-page-lead">' + data.lead + coursePassIntro + '</div></div></div>';
			courseStatus.length += 1;
			$.each(data.content, function(entryIndex, entry) {
				var pageTitle = '';
				var pageMain = '';
				var pageOption = '';
				var pageOptions = [];
				var pageList = '';
				var pageValue = 0; 
				var pagePoint = '';
				var pageExplain = '';
				var pageImage = '';
				var isTrue = '';
				var isFalse = '';

				pageExplain = entry.explain || '';
				if (pageExplain !== '') {
					pageExplain = '<div class="n-page-explain animated running fadeInLeft delay-300">' + pageExplain + '</div>';
				}
				pagePoint = entry.point || '';
				if (pagePoint !== '') {
					pagePoint = '<div class="n-page-point">' + pagePoint + '</div>';
				}
				if (entry.pageType === 'quiz') {
					pageTitle = '<h3 class="n-page-title">' + entry.title + '</h3>';
					pageMain = '<div class="n-page-lead">' + entry.question + '</div>'; 
					pageValue = parseInt(entry.value, 10) || 1;

					pageOptions.push('<div class="n-option" value=' + pageValue + '>' + entry.rightanswer + '</div>');
					$.each(entry.wronganswer, function(itemIndex, item) {
						pageOptions.push ('<div class="n-option">' + item + '</div>');
					});
					if (entry.randomize !== false) {
						pageOptions = shuffleArray(pageOptions);
					}
					$.each(pageOptions, function(itemIndex, item) {
						pageOption += item;
					});
					pageOption = '<div class="n-option-container">' + pageOption + '</div>'; 
					courseHTML += '<div class="n-page n-page-quiz"><div class="n-page-inner">' + pageTitle + pageMain + pageOption + pagePoint + pageExplain + '</div></div>';
				} else if (entry.pageType === 'trueOrFalse') {
					isTrue = '';
					isFalse = '';
					pageValue = parseInt(entry.value, 10) || 1;
					if (entry.rightanswer === true) {
						isTrue = ' value=' + pageValue;
					} else {
						isFalse = ' value=' + pageValue;
					}
					pageTitle = '<h3 class="n-page-title">' + getCaption('trueOrFalse') + '</h3>';
					pageMain = '<div class="n-page-lead">' + entry.question + '</div>'; 
					pageValue = parseInt(entry.value, 10) || 1;
					pageOption = '<div class="n-true"' + isTrue + '>' + getCaption('trueStatement') + '</div><div class="n-false"' + isFalse + '>' + getCaption('falseStatement') + '</div>';
					pageOption = '<div class="n-true-false-container">' + pageOption + '</div>'; 
					courseHTML += '<div class="n-page n-page-true-false"><div class="n-page-inner">' + pageTitle + pageMain + pageOption + pagePoint + pageExplain + '</div></div>';
				} else if (entry.pageType === 'list') {
					pageTitle = '<h3 class="n-page-title">' + entry.title + '</h3>';
					pageMain = '<div class="n-page-lead">' + entry.text + '</div>';
					pageList = '';
					$.each(entry.list, function(itemIndex, item) {
						pageList += '<div class="n-list"><div class="n-list-title">' + item.title + '</div><div class="n-list-text-container animated running fadeIn"><div class="n-list-text-inner"><div class="n-list-BG"></div><div class="n-list-text"><div class="n-list-text-title"><div class="n-list-close"></div>' + item.title + '</div><div class="n-list-text-content">' + item.text + '</div></div></div></div></div>';
					});
					pageList = '<div class="n-list-container">' + pageList + '</div>';
					courseHTML += '<div class="n-page"><div class="n-page-inner">' + pageTitle + pageMain + pageList + '</div></div>';
				} else if (entry.pageType === 'image-text') {
					pageTitle = '<h3 class="n-page-title">' + entry.title + '</h3>';
					pageMain = '<div class="n-page-lead">' + entry.text + '</div>';
					if (entry.image && entry.image !== '') {
						pageImage = '<div class="n-home-course-container"><div class="n-home-course-inner" style="background-image: url(' + entry.image + ')"></div></div>';
					} 
					courseHTML += '<div class="n-page"><div class="n-page-inner">' + pageImage + pageTitle + pageMain + '</div></div>';
				}
				courseStatus.fullScore += pageValue;
				courseStatus.length += 1;
			});
			courseHTML += '<div class="n-page n-page-last"><div class="n-page-inner"><h3 class="n-page-title"></h3><div class="n-page-lead"></div></div></div>';
			courseStatus.length += 1;
			document.getElementById('n-course-inner').innerHTML = courseHTML;
			openPage(0);
			$.get(courseUrl, function(data) {
				var index = 0;
				var currentSessionIndex;
				var nextSessionIndex;
				var sessionsList = [];
				$.each(data, function(chapterIndex, chapter){
					$.each(chapter.sessions, function(sessionIndex, session){
						if (session.id === id) {
							currentSessionIndex = index;
						}
						sessionsList.push(session);
						index += 1;
					});
				});
				if (currentSessionIndex < index -1) {
					nextSessionIndex = currentSessionIndex + 1;
					courseStatus.nextSession = sessionsList[nextSessionIndex].id;
				} else {
					courseStatus.nextSession = '';
				}
			});
		});
	}

	function courseAction(action) {
		if (courseStatus.buttonDisable === true) {
			return;
		}
		var currentPage = $('.n-page').eq(courseStatus.current);
		var currentOption;
		var currentValue;
		var currentPoint = '';
		if (action === 'next') {
			if (courseStatus.current === courseStatus.length -1) {//last page
				courseStatus.current = 0;
			} else if (courseStatus.current < courseStatus.length -1) {
				courseStatus.current += 1; 
			}
			openPage(courseStatus.current);
		} else if (action === 'confirm') {
			currentOption = currentPage.find('.n-option.selected,.n-true.selected,.n-false.selected');
			currentValue = parseInt(currentOption.attr('value'), 10) || 0;
			currentPoint = currentPage.find('.n-page-point').html() || '';
			if (currentOption.attr('value') >= 1) {
				courseStatus.score += currentValue; 
				currentOption.addClass('is-correct animated running tada');
				if (currentPoint !== '') {
					courseStatus.rightPoints.push(currentPoint);
				}
			} else {
				currentOption.addClass('is-wrong animated running shake');
				currentPage.find('.n-option[value],.n-true[value]').addClass('is-correct');
				if (currentPoint !== '') {
					courseStatus.wrongPoints.push(currentPoint);
				}
			}
			currentPage.addClass('done');
			courseStatus.action = 'next';
			document.getElementById('n-course-button').innerHTML = getCaption('next');
		} else if (action === 'nextSession') {
			if (courseStatus.nextSession !== '') {
				openSession(courseStatus.nextSession);
			} else {
				backButton();
			}
		} else if (action === 'retry') {
			openSession(courseStatus.currentSession);
		}
		//console.log (courseStatus.score);
	}

	// back function
	$('body').on('click', '.n-header__back', function(){
		backButton();
	});

	// click into a course
	$('body').on('click', '.n-course-link', function(){
		openSession(this.href, this.title);
		return false;
	});

	$('body').on('click', '#n-course-button', function(){
		courseAction(courseStatus.action);
	});

	$('body').on('click', '.n-option, .n-true, .n-false', function(){
		if ($(this).parentsUntil('n-page').parent().hasClass('done') === true) {
			return;
		}
		$(this).parent().find('.n-option,.n-true, .n-false').removeClass('selected');
		$(this).addClass('selected');
		var courseButton = $('#n-course-button');
		courseButton.html(getCaption('confirm'));
		courseButton.removeClass('disabled');
		courseStatus.action = 'confirm';
		courseStatus.buttonDisable = false;
	});
	$('body').on('click', '.n-list-title', function(){
		$(this).parent().parent().find('.n-list').removeClass('on');
		$(this).parent().addClass('on');
	});
	$('body').on('click', '.n-list-BG, .n-list-close', function(){
		$(this).parentsUntil('n-list').parent().removeClass('on');
		console.log('test');
	});

	// get JSON data for home page
    $.get('api/courses.json', function(data) {
    	var startScreen = document.getElementById('start-screen'),
    		homeContent = '';
    	if (typeof data === 'object') {
	    	$.each(data, function(entryIndex, entry) {
	    		var bgClass;
	    		var innerClass;
	    		var sClass;
	    		var sMod;
	    		var mClass;
	    		var mMod;
	    		var lClass;
	    		var lMod;
	    		var containerClass;
	    		var clearFloat;
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
	    		homeContent += '<a href="course/' + entry.id + '" title="' + entry.title + '" class="n-course-link"><div class="' + containerClass + '"><div class="' + innerClass + '" /*style="background-image: url(' +  entry.image + '?'+ entry.id + ')"*/><div class="n-home-course-title">' + entry.title + '</div></div></div></a>' + clearFloat;
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