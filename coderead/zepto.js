var Zepto = (function(){
	var undefined,$,zepto = {},document = window.document,
		emptyArray = [],slice = emptyArray.slice,filter = emptyArray.filter,
		class2type = {},
		toString = class2type.toString,
		// 提供get和set的方法名
		methodAttributes = ['val','css','html','text','data','width','height','offset'],
		isArray = Array.isArray || function(object){return object instanceof Array};

	//初始化一些变量及正则
	var tempParent = document.createElement('div'),
		simpleSelectorRE = /^[\w-]*$/,
		fragmentRE = /^\s*<(\w+|!)[^>]*>/,
		singleTagRE = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
		tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig;

	

	var table = document.createElement('table'),
		tableRow = document.createElement('tr'),
		containers = {
			'tr':document.createElement('tbody'),
			'tbody':table,
			'thead':table,
			'tfoot':table,
			'td':tableRow,
			'th':tableRow,
			'*':document.createElement('div')
		}

	function type(obj){
		return obj == null ? String(obj):class2type[toString.call(obj)]||"object";
	}

	function isFunction(value){ // 判断是否是function
		return type(value) == "function";
	}
	function isWindow(obj){
		return obj != null && obj == obj.window;
	}
	function isObject(obj){
		return type(obj) == "object";
	}
	function isDocument(obj) { // 判断是否是document
		return obj != null && obj.nodeType == obj.DOCUMENT_NODE;
	}
	// isPlainObject对于字面量定义的对象和new Object的对象返回true,
	// new Object时传入参数时返回false.
	// 对于自定义的类，new后的对象，$.isPlainObject也会返回false
	function isPlainObject(obj){ 
		return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype;
	}
	// 类数组，比如nodelist这个只是做最简单的判断，如果给一对象定义一个值为number的length属性，它同样会返回true
	function likeArray(obj){
		return typeof obj.length == 'number';
	}
	// 清除给定的参数中null或undefiend，注意0==null,''==null为false
	function compact(array){
		return filter.call(array,function(item){
			return item != null;
		});
	}
	// dom元素是否匹配某css selector
	zepto.matches = function(element,selector){
		if(!selector || !element || element.nodeType !== 1) return false;
		// 特性检测来统一API接口
		var matchesSelector = element.webkitMatchesSelector || element.mozMatchesSelector || element.oMatchesSelector || element.matchesSelector;

		if(matchesSelector){
			return matchesSelector.call(element,selector);
		}

		var match,
			parent = element.parentNode,// 已经存在于页面中的元素
			temp = !parent;

		// 动态创建的元素,尚未添加到页面中
		if (temp) {
			(parent = tempParent).appendChild(element);
		};
		// 将parent作为上下文，来查找selector的匹配结果，并获取element在结果集的索引，不存在时为－1,再通过~-1转成0，存在时返回一个非零的值
		match = ~zepto.qsa(parent,selector).indexOf(element);

		// 将插入的节点删除
		temp && tempParent.removeChild(element);

		return match;
	}
	zepto.qsa = function(element, selector){
		var found,
			maybeId = selector[0] == '#',
			maybeClass = !maybeId && selector[0] == '.',
			nameOnly = maybeId || maybeClass ? selector.slice(1) : selector,
			isSimple = simpleSelectorRE.test(nameOnly);

				// 当element为document,且selector为一级选择器，且selector为ID选择器时
		return (isDocument(element) && isSimple && maybeId)?
				// 直接返回element.getElementById,当没有找到节点时返回空
				((found = element.getElementById(nameOnly))?[found]:[]):
				// 当element不为元素节点或document时，返回[]
				((element.nodeType !== 1 && element.nodeType !== 9)?[]:
					(slice.call(
						isSimple && !maybeId ?
						// 如果selector是类名,直接调用getElementsByClassName
						(maybeClass?element.getElementsByClassName(nameOnly):
						// 如果selector是标签名,直接调用getElementsByClassName
						element.getElementsByTagName(selector)):
						// 否则调用querySelectorAll
						(element.querySelectorAll(selector))
					))
			);
	}

	// '$.zepto.gragment'将提供的标签字符串生成节点
	zepto.fragment = function(html,name,properties){
		var dom,nodes,container;
		// 优化单标签特例
		if (singleTagRE.test(html)) {
			dom = $(document.createElement(RegExp.$1));
		};
		if(!dom){
			if(html.replace){ // 将类似<div class="a"/>替换成<div class="a"></div>
				html = html.replace(tagExpanderRE,"<$1></$2>");
			}
			if(name === undefined){ // 给name取标签名
				name = fragmentRE.test(html) && RegExp.$1;
			}
			// 设置容器标签名如果不是'tr,tbody,thead,tfoot,td,th'则容器标签名为div
			if (!(name in containers)) { name = '*'};
			//创建容器
			container = containers[name];
			//将html代码片断放入容器
			container.innerHTML = ''+html;
			console.log(container);
			dom = $.each(slice.call(container.childNodes),function(){
				container.removeChild(this);
			});
		};
		if(isPlainObject(properties)){ // 如果propertities是字面量对象或new Object
			nodes = $(dom);
			$.each(properties,function(key,value){
				//如果设置的是'val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'，
				//则调用zepto上相对应的方法
				if (methodAttributes.indexOf(key) > -1) {
					nodes[key](value);
				}else{
					nodes.attr(key,value);
				};
			});
		}
		return dom;
	}

	// '$.zepto.Z'将dom的原型指向$.fn,从而为dom指供所有Zepto功能,需注意'_proto_'不支持IE
	zepto.Z = function(dom, selector){
		dom = dom || [];
		dom._proto_ = $.fn;
		dom.selector = selector || "";
		return dom;
	}
	// '$.zepto.isZ'判断给定的参数是否是Zepto集
	zepto.isZ = function(object){
		return object instanceof zepto.z;
	}
	// '$.zepto.init'是jquery的'$.fn.init'的副本，
	zepto.init = function(selector, context){
		var dom;
		// 如果未提供selector，返回空数组
		if(!selector){
			return zepto.Z();
		}else if(typeof selector == 'string'){ // 处理字符串格式的selector
			selector = selector.trim();
			if(selector[0] == "<" && fragmentRE.test(selector)){ // 如果是一段HTML代码片断，则将其转成DOM节点
				dom = zepto.fragment(selector,RegExp.$1,context),selector = null;
			}else if(context != undefined){ // 如果存在上下文context，selector为普通css选择器，则在上下文中查找selector，
				return $(context).find(selector);
			}else{ // 如果没有给定context,selector为普通CSS选择器，则在document中查找selector
				dom = zepto.qsa(document,selector);
			}
		}else if(isFunction(selector)){ // 处理函数格式的selector,Dom ready后执行
			return $(document).ready(selector);
		}else if(zepto.isZ(selector)){ // 处理Zepto集合selector直接返回selector
			return selector;
		}else{
			if(isArray(selector)){
				//如果selector是一个数组，则将其null,undefind去掉
				dom = compact(selector);
			}else if(isObject(selector)){
				//如果selector是个对象
				dom = [selector],selector = null;
			}else if(fragmentRE.test(selector)){
				dom = zepto.fragment(selector.trim(),RegExp.$1,context),selector=null
			}else if(context !== undefined){
				return $(context).find(selector);
			}else{
				dom = zepto.qsa(document,selector);
			}
		}
		return zepto.Z(dom,selector); // 把找到的字节处理成Zepto集合
	}

	// '$'是基于'Zepto'的对象，当执行这个function时会调用$.zepto.init
	$ = function(selector,context){
		return zepto.init(selector,context);
	}

	$.trim =function(str){
		return str == null ? "" : String.prototype.trim.call(str);
	}
	// 遍历数组，将每条数据作为callback的上下文，并传入数据及数据索引进行处理，如果其中一条数据处理结果返回false
	// 则停止遍历，返回elements
	$.each = function(elements,callback){
		var i,key;
		if(likeArray(elements)){
			for(i=0;i<elements.length;i++){
				if(callback.call(elements[i],i,elements[i]) === false){
					return elements;
				}
			}
		}else{
			for(key in elements){
				if(callback.call(elements[key],key,elements[key]) === false){
					return elements;
				}
			}
		}
		return elements;
	}
	// 查找满足过滤函数的数组元素，原始数组不受影响,jquery中有第3个参数，这里不需要
	$.grep = function(elements,callback){
		return filter.call(elements,callback);
	}
	$.zepto = zepto;
	
	return $;
})();
// 如果'$'没有被定义，被指向'Zepto'
window.Zepto = Zepto;

window.$ === undefined && (window.$ = Zepto);