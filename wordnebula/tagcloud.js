var JSONP = {}
JSONP.get = function(url, callback){

    var scriptTag = document.createElement('script')
    var callbackName = '_' + new Date().getTime()
    window[callbackName] = function(){
        callback.apply(null, arguments)
        delete window[callbackName]
    }
    if (url.indexOf('?') != -1)
        url += '&callback=' + callbackName
    else
        url += '?callback=' + callbackName
    scriptTag.src = url
    document.head.appendChild(scriptTag)
}

var CommonWords = {}
CommonWords.english = "a about after again against all an another any and are as at\
 be being been before but by\
 can could\
 did do don't down\
 each\
 few from for\
 get got great\
 had has have he her here his him himself hers how\
 i if i'm in into is it it's\
 just\
 like\
 made me most my\
 no not\
 of off on once one only or other our out over own\
 said she should so some such\
 than that the their them then there these they this those through to too\
 under until up\
 very\
 was wasn't we were we're what when where which while who why will with would wouldn't\
 you your rt http".split(' ')

var ColorPalettes = {}
ColorPalettes.autumn = 
[
    [255, 136, 64],
    [149, 141, 79],
    [115, 123, 85],
    [89, 85, 64],
    [81, 62, 56]
]

ColorPalettes.scheme1 = 
[
    [255,154,0],
    [255,250,0],
    [245,0,82],
    [14,114,224],
    [255,171,0],
    [160,0,255],
    [127,255,127]
]

var word_dictionary = {}
/* ============== Util Functions ========================== */
function Word(word) {
    this.text = word;
    this.color = 'white';
    this.x = 100;
    this.y = 100;
    this.width = 1;
    this.height = 1;
	this.freq = 1;
	this.assoc = {};
}

function getText(elm, excludeTags){
	if (elm.nodeType == 3) return elm.nodeValue
	if (excludeTags && elm.tagName && 
	    excludeTags.indexOf(elm.tagName.toLowerCase()) != -1) return ''
	var ret = ''
	for (var i = 0; i < elm.childNodes.length; i++){
		ret += getText(elm.childNodes[i], excludeTags)
	}
	return ret
}

function keys(obj){
    var ret = []
    for (var key in obj) ret.push(key)
    return ret
}

function tokenize(text, commonWords){
    return text
    	.replace(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig, ' ')
        .replace(/[^\'a-zA-Z]/g, ' ')
        .split(' ')
        .filter(function(p){return p != ''})
        .map(function(word){
            return word.toLowerCase()
        })
        .filter(function(word){
        	return commonWords.indexOf(word) == -1
        })
}

function createWords(text, commonWords){
    var words = tokenize(text, commonWords)
	var word_dict = {}
	var tempwords = words.slice(0)
	tempwords.sort()
	tempwords.reverse()
	var associationfrequndirected = {}
	for (var i = 0; i < tempwords.length; i++){
		if(tempwords[i] in word_dict){
			word_dict[tempwords[i]].freq++
		}
		else {
			word_dict[tempwords[i]] = new Word(tempwords[i])
		}
	}
	console.log(word_dict)
	for (var i=0; i+1<words.length; i++){
		if (words[i + 1] != words[i]) {
			if (words[i + 1] in word_dict[words[i]].assoc) // checks if the next word is already in the dictionary of associated words.
				word_dict[words[i]].assoc[words[i + 1]]++ // if it is, the association count is increased by 1.
			else // if not, the word is add to the associated list of words and defaulted to 1.
 				word_dict[words[i]].assoc[words[i + 1]] = 1
			
			if (words[i] in word_dict[words[i + 1]].assoc) // checks if the next word is already in the dictionary of associated words.
				word_dict[words[i + 1]].assoc[words[i]]++ // if it is, the association count is increased by 1.
			else // if not, the word is add to the associated list of words and defaulted to 1.
 				word_dict[words[i + 1]].assoc[words[i]] = 1
		}
	}
	return word_dict
}

function calculateSizeScale(word_dictionary){
    var max = 0
    keys(word_dictionary).forEach(function(word){
        if (word_dictionary[word].freq > max)
            max = word_dictionary[word].freq
    })
    return 110 / max
}

function boxesOverlap(ax, ay, aw, ah, bx, by, bw, bh){
    var pad = 10
    if (ax + aw + pad < bx) return false
    if (bx + bw + pad < ax) return false
    if (ay + ah * 0.5 + pad < by - bh) return false
    if (by + bh * 0.5 + pad < ay - ah) return false
    return true
}

function stripHTML(oldString) {
    var data = []
    var inTag = false;
    for(var i = 0; i < oldString.length; i++) {
        var chr = oldString.charAt(i)
        if (chr == '<') inTag = true;
        if (chr == '>') inTag = false;
        if(!inTag) data.push(chr)
    }
    return data.join('');
}

/* ========== Print Words to Canvas Element ============================ */

var Layouts = {}


Layouts.printWords = function PrintWordsLayout(canvas, colors, fontName){

    function estimateSizeScale(width, height){
        var totalRelArea = 0
        var wordCount = 0
        for (var word in word_dictionary){
            var fontSize = word_dictionary[word].freq
            var wordArea = (fontSize * 1.5 * (word.length * fontSize * 0.8))
            totalRelArea += wordArea
            wordCount++
        }
        var area = (width - 2 * padding) * (height - 2 * padding)
        return Math.sqrt(area / totalRelArea)
    }
    var padding = 20
    var context = canvas.getContext('2d');
    // Clear the context in case of redraw
    context.clearRect(0, 0, canvas.width, canvas.height);
    var sizeScale = estimateSizeScale(canvas.width, canvas.height)
    console.log('sizeScale: ' + sizeScale)
    
    //THIS MAY NEED TO BE MODIFIED TO ACCOMODATE THE STRUCTURE OF EACH WORD OBJECT
    var words = keys(word_dictionary).sort()
	words.reverse()
	//THIS MAY NEED TO BE MODIFIED TO ACCOMODATE THE STRUCTURE OF EACH WORD OBJECT
	
	var pad = 5;
	var maxTextHght = 0;
	var avoid_x = canvas.width;
	var avoid_y = canvas.height - pad;
	//console.log("avoid_x="+ avoid_x+", avoid_y="+avoid_y);
	
	/** print word **/
	// for each word	
	words.forEach(function(word){
		var textHeight = word_dictionary[word].freq * sizeScale
		if (textHeight > maxTextHght)
			maxTextHght = textHeight;	
		if (textHeight < 5) return 
		//if (textHeight > 50) avoid_y+=textHeight/4;
        context.font = textHeight + 'px ' + fontName
        var textWidth = context.measureText(word).width
		//console.log('avoid_x is now: ' + avoid_x)
        //console.log('Word: ' + word  + ' height: ' + textHeight + ' width: ' + textWidth)
	
		// check if distance between last x and canvas width is less than width of word
		if( (avoid_x - textWidth) > 20){
			var x = avoid_x - textWidth;
			avoid_x = x;
			var y = avoid_y;
			//console.log('avoid: ' + x + ', ' + y + ', avoid_x=' + avoid_x)
			//var c = Math.floor(Math.random() * colors.length)
        	//var c = word_dictionary[word].color;
        	//context.fillStyle = 'rgba(' + c.join(',') + ', 1)'
			context.fillStyle = word_dictionary[word].color;
        	context.font = textHeight + 'px ' + fontName
	        //console.log('fillText: ' + [word, x, y].join(', '))
			word_dictionary[word].x = x;
			word_dictionary[word].y = y;
			word_dictionary[word].height = textHeight;
			word_dictionary[word].width = textWidth;
       
        	context.fillText(word, x, y)
		}  else if((avoid_x - textWidth) < 20){
			avoid_x = canvas.width - textWidth;
			var x = avoid_x;
			avoid_y -= maxTextHght+pad;
			var y = avoid_y;
			//console.log('avoid: ' + x + ', ' + y + ', avoid_x=' + avoid_x)	
			//console.log('avoid: ' + x + ', ' + y)			
			//var c = Math.floor(Math.random() * colors.length)
        	//var c = colors[c]
        	//context.fillStyle = 'rgba(' + c.join(',') + ', 1)'
			context.fillStyle = word_dictionary[word].color;
        	context.font = textHeight + 'px ' + fontName
	        //console.log('fillText: ' + [word, x, y].join(', '))
			word_dictionary[word].x = x;
			word_dictionary[word].y = y;
       		word_dictionary[word].height = textHeight;
			word_dictionary[word].width = textWidth;
        	context.fillText(word, x, y)
			maxTextHght = 0;
		}
		
		// track right-most x, right-most y
		//avoid_x = context.canvas.width * Math.random();
		//avoid_y = context.canvas.height * Math.random();
		avoid_x -= pad;
	 })
}



/* =========== main entry point ========================= */

TagCloud = {}
TagCloud.loadFromText = function(text){
    var commonWords = CommonWords.english
	word_dictionary = createWords(text, commonWords)
    this.loadFromWordFreq()
}
TagCloud.loadFromWordFreq = function(){
    var layout = Layouts.printWords
    var palate = ColorPalettes.scheme1
    var fontName = getComputedStyle(document.body)['font-family']
    var canvas = document.getElementById('display')

    document.body.style.padding = '0'
    document.body.style.margin = '0'
    
    layout(canvas, palate, fontName)
}

TagCloud.loadTweets = function(){
	var count = document.getElementById('tweets').value;
	var user = document.getElementById('twitter_user').value;
	JSONP.get('https://api.twitter.com/1/statuses/user_timeline.json?include_entities=false&include_rts=false&screen_name=' + user + '&count='+ count + '&trim_user=true&exclude_replies=true', function(data){
		var text = '';
		data.forEach(function(entry){
			console.log(text);
			text+=entry.text + '\n';
		})	
		TagCloud.loadFromText(text);
		})	
	
}

TagCloud.loadTwitterQuery = function(){
	var twitter_query_count = document.getElementById('twitter_query_count').value;
	var twitter_query = document.getElementById('twitter_query').value;
	var queryURL = 'http://search.twitter.com/search.json?q='+ twitter_query +'&rpp='+ twitter_query_count +'&include_entities=false&result_type=mixed';
	console.log('Twitter Query URL ' + queryURL);
	JSONP.get(queryURL, function(data){
		var text = '';
		data.results.forEach(function(entry){
			console.log(text);
			text+=entry.text + '\n';
		})	
		TagCloud.loadFromText(text);
		})	
	
}

TagCloud.loadFromFeed = function(){
	var url = document.getElementById('rss').value;
	console.log('rss url entered: ' + url);
	var numEntries = document.getElementById('rsscount').value;
	var rand = new Date().getTime()
	JSONP.get('http://www.google.com/uds/GlookupFeed?context=0&hl=en&q=' + encodeURI(url) + '&v=1.0&nocache=' + rand, function(v, data){
		if(data.url == 'null'){
				alert("No associated RSS feed found with url " + url);
	
		} else{
		rand = new Date().getTime()
		JSONP.get('http://www.google.com/uds/Gfeeds?context=1&num=' + numEntries + '&hl=en&output=json&q=' + encodeURI(data.url) + '&v=1.0&nocache=' + rand, function(v, data){
			
			var entries = data.feed.entries;
			
			
			var text = '';
			entries.forEach(function(entry){
				text += entry.title + '\n';
			   	text += stripHTML(entry.content) + '\n';
			})			
			
			TagCloud.loadFromText(text);	
		})
		}
	})
   	
   
}


TagCloud.runBookmarklet = function(target){
	target = target || 'textBox';
	console.log("Running bookmarklet with target: " + target);
	var text = '';
	if(target == 'textBox'){
		text = document.getElementById('textBox').value;	
	    this.loadFromText(text)
	}
	else if(target == 'twitter_user'){
		TagCloud.loadTweets();
	}
	else if(target == 'twitter_query'){
		TagCloud.loadTwitterQuery();
	}
	else if (target == 'rss'){
		TagCloud.loadFromFeed();
	}

}

TagCloud.processClick = function(x, y){
	console.log("Before adjusting, user clicked at x="+x+", and y="+y);
	x = x - 50;
	y = y - 50;
	console.log("User clicked at x="+x+", and y="+y);
	for (var word in word_dictionary){
		var wordObj = word_dictionary[word];
		word_dictionary[word].color = 'rgba(80, 80, 80, 0.5)';
	}
	for (var word in word_dictionary){
		var wordObj = word_dictionary[word];
		if (x >= wordObj.x && x <= (wordObj.x + wordObj.width) && y <= wordObj.y && y >= (wordObj.y - wordObj.height)){
			console.log("Word="+wordObj.text+", from x="+wordObj.x+" to x="+(wordObj.x + wordObj.width)+", from y="+(wordObj.y - wordObj.height)+" to y="+wordObj.y);
			word_dictionary[wordObj.text].color = 'rgba(255, 63, 47, 1)';
			var assocList = wordObj.assoc;
			var list = Object.keys(assocList);
			var max = 0;
			for (var i = 0; i < list.length; i++){
				if(assocList[list[i]] > max){
					max = assocList[list[i]];
				}
			}
			for (var i = 0; i < list.length; i++){
				var col = 1/max * assocList[list[i]];
				word_dictionary[list[i]].color= 'rgba(170, 255, 90, '+col+')';
				//console.log("AssocList["+i+"]="+list[i]+" and count="+assocList[list[i]]);
			}
			
			//console.log("Word=" + word_dictionary[word].text + ", x="+ word_dictionary[word].x + ", width =" + wordObj.width + ", y=" + word_dictionary[word].y + ", height=" + wordObj.height);	
		} 
		
	}
    var layout = Layouts.printWords
    var palate = ColorPalettes.scheme1
    var fontName = getComputedStyle(document.body)['font-family']
    var canvas = document.getElementById('display')

    document.body.style.padding = '0'
    document.body.style.margin = '0'
    document.body.style.overflow = 'auto'
    layout(canvas, palate, fontName)
	
}
