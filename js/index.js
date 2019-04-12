let musicRender = (function () {
    let $headerBox = $('.headerBox'),
        $contentBox = $('.contentBox'),
        $footerBox = $('.footerBox'),
        $wrapper = $contentBox.find('.wrapper'),
        music = $('#music')[0],
        $playButton = $headerBox.find('.playButton'),
        $already = $footerBox.find('.already'),
        $duration = $footerBox.find('.duration'),
        $current = $footerBox.find('.current'),
        $lyricList = null;

    let computedContentH = function () {
        let winH = document.documentElement.offsetHeight,
            headerH = $headerBox[0].offsetHeight,
            footerH = $footerBox[0].offsetHeight,
            contentMargin = parseFloat($contentBox.css('margin-top')) * 2,
            contentH = winH - headerH - footerH - contentMargin;
        $contentBox.css('height', contentH);
    };

    let queryData = function () {
        return new Promise(resolve => {
            $.ajax({
                url: 'json/storm.json',
                dataType: 'json',
                success: resolve
            })
        });
    };

    let bindHTML = function (data) {
        let lyric = data['lrc']['lyric'],
            str = ``;
        //=>正则如果需要匹配\n特殊字符，直接用\n就可以
        lyric.replace(/\[(\d+):(\d+)\.\d+\](.+?)\n/g, (...arg) => {
            let [, minute, second, text] = arg;
            str += `<p data-minute='${minute}' data-second='${second}'>${text}</p>`;
        });
        $wrapper.html(str);
        $lyricList = $wrapper.find('p');
    };

    let play = function () {
        let pond = $.Callbacks();
        pond.add(handlePlayButton);
        pond.add(handlePlay);
        music.play();
        music.addEventListener('canplay', pond.fire);
    };

    let handlePlayButton = function () {
        $playButton.css('display', 'block');
        $playButton.addClass('active');
        $playButton.tap(() => {
            console.log(music.paused);//=>为什么输出的次数会随着播放的次数增加，比如我播一遍是打印1次，播第二遍就是打印2次了，播第三遍就是打印3次了
            //=>音乐播放完之后再播放就会出bug？还会导致tap的bug(执行多次)？
            if (music.paused) {
                music.play();//=>跟这个有关，去掉这行就不会执行多次
                $playButton.addClass('active');
                handlePlay();
            } else {
                music.pause();
                $playButton.removeClass('active');
                clearInterval(autoTimer);
            }
        });
    };

    let autoTimer = null;
    let handlePlay = function () {
        let duration = music.duration;
        autoTimer = setInterval(() => {
            let already = music.currentTime;
            if (already>=duration) {
                clearInterval(autoTimer);
                $already.html(formateTime(already));
                $current.css('width', '100%');
                musicEnd();
            }
            $already.html(formateTime(already));
            $current.css('width', already / duration * 100 + '%');
            matchLyric(formateTime(already));
        }, 1000);
        $duration.html(formateTime(duration));
    };

    let formateTime = function (time) {
        let minute = Math.floor(time / 60),
            second = Math.floor(time - 60 * minute);
        minute < 10 ? minute = '0' + minute : null;
        second < 10 ? second = '0' + second : null;
        return `${minute}:${second}`
    };

    let translateY = 0;
    let matchLyric = function (time) {
        let [minute, second] = time.split(':'),
            $curLyric = $lyricList.filter(`[data-minute='${minute}']`).filter(`[data-second='${second}']`);
        if ($curLyric.length) {
            if ($curLyric.hasClass('active')) {
                return
            }
            $curLyric.addClass('active').siblings().removeClass('active');
            if ($curLyric.index() >= 4) {
                translateY -= $curLyric[0].offsetHeight;
                $wrapper.css('transform', `translateY(${translateY}px)`);
            }
        }
    };

    let musicEnd = function () {
        let endTimer = setTimeout(()=>{
            music.pause();
            translateY = 0;
            $playButton.removeClass('active');
            $wrapper.css('transform', `translateY(${translateY}px)`);
            $already.html('00:00');
            $current.css('width', '0');
            clearTimeout(endTimer);
        },1000);

    };

    return {
        init: function () {
            computedContentH();
            let promise = queryData();
            promise.then(bindHTML)
                .then(play);
        }
    }
})();
musicRender.init();