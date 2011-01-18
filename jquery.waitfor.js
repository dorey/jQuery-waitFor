(function($){
    if(parseFloat($().jquery) < 1.4) {console.error("Requires jQuery version 1.4 or greater.")}
    function concatArgs(args) {return [].splice.call(args,0);}
    
    var designatedNames = {},
        version = "0.0";
    
    /*-- Waiter() is created for the individual things that need
    -    to be waited on.
    -    
    -    The waiter must have a defined "begin" function which must
    -    have an eventual callback to it's internal $finish function.
    -    n.b.: the internal $finish function can be referenced globally
    -          by jQuery.w4['waiterName'].$finish()
    --*/
    function Waiter(_callingObject, name, opts) {
        this.$name = name;
        this._begin = opts.begin;
        this._finish = opts.finish;
        this.waitings = [];
        this.$begun = false;
        this.$finished = false;
        var _waiter = this;
        this.$finish = function(){
            var _caller = this;
            _waiter.$_finish(_caller);
        }
        this.$begin = function(){
            var _caller = this;
            _waiter.$_begin(_caller);
        }
    }
    $.extend(Waiter.prototype, {
        $_begin: function(){
            this._begin();
        },
        $_finish: function(){
            this.$finished = true;
            if('undefined'!==typeof this.$_finish) {
                this._finish();
            }
            $(this.waitings).each(function(){
                this.checkWaiters();
            })
        },
        toString: function(){
            return "I am a waiter named " + this.$name;
        }
    });
    /*-- MakeWaiter, or $.waiter, checks the arguments of the
    -    waiter to be defined.
    --*/
	function MakeWaiter(waiterName, opts){
	    if('string'!==$.type(waiterName)) {
	        console.error("First parameter, waiterName, must be a string but is type ", $.type(waiterName));
	    }
	    if('undefined'!==typeof designatedNames[waiterName]) {
	        console.error("A waiter with the name "+ waiterName + " has already been defined.");
	    }
	    
	    if(!opts) {console.error("No options defined")}
        if(!opts.begin) {console.error("No 'begin' defined for waiter.", this.$name)}
        if("function"!==typeof opts.begin) {console.error("'begin' must be a callable function for waiter.", this.$name)}
        
		var waiter = new Waiter(this, waiterName, opts);
		designatedNames[waiterName] = waiter;
		return function(cb){
		    return WaitFor(waiter, cb);
		};
	}
	

    /*-- Waiting() is created internally for the things that wait on
    -    the pre-defined Waiters.
    --*/
	function Waiting(waiters, callback) {
	    this.waiters = waiters;
	    this.callback = callback;
        this.startWaiters();
	    this.checkWaiters();
	}
	$.extend(Waiting.prototype, {
	    startWaiters: function(){
	        $(this.waiters).each(function(){
    	        if(!this.$begun) {this.$begin();}
    	    });
	    },
	    checkWaiters: function(){
	        var _statuses = [], _finished = true, _waiting = this;
    	    $(this.waiters).each(function(){
    	        if(!this.$finished) {
    	            _finished = false;
    	        }
    	    });
    	    if(_finished) {
    	        this.complete();
    	    }
	    },
	    complete: function(){
	        this.callback();
	    }
	})
    /*-- WaitFor, or $.waitFor, checks the arguments of the wa
    -    to be waited on and creates a Waiting() object.
    --*/
	function WaitFor() {
		var args = concatArgs(arguments),
		    _valid = true,
		    waiters = [], cb;
		$(args).each(function(){
		    if(this instanceof Waiter) {
		        waiters.push(this);
		    } else if("string"===$.type(this)) {
                if('undefined'==$.type(designatedNames[String(this)])) {
                    _valid = false;
                    console.error("Waiter name "+String(this)+" is not defined.");
                } else {
                    waiters.push(designatedNames[String(this)]);
                }
		    } else if("function"===$.type(this)) {
		        cb = this;
		        return false;
		    } else {
		        _valid = false;
                console.error("Invalid waiter parameter", this);
                return false;
		    }
		});
		if(_valid) {
            var _waiting = new Waiting(waiters, cb);
            $(waiters).each(function(){
                if(this.waitings.indexOf(_waiting)==-1) {
                    this.waitings.push(_waiting);
                }
            })
		} else {
		    return false;
		}
	}
	
	/*-- Globally accessible objects --*/
	$.waiter = MakeWaiter;
    $.waitFor = WaitFor;
    $.waitFor.version = version;
    $.w4 = designatedNames;
})(jQuery)
