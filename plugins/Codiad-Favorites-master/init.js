/*
 * Copyright (c) Codiad & Andr3as, distributed
 * as-is and without warranty under the MIT License.
 * See http://opensource.org/licenses/MIT for more information. 
 * This information must remain intact.
 */

(function(global, $){
    
    var codiad = global.codiad,
        scripts = document.getElementsByTagName('script'),
        path = scripts[scripts.length-1].src.split('?')[0],
        curpath = path.split('/').slice(0, -1).join('/')+'/';

    $(function() {
        codiad.Favorites.init();
    });

    codiad.Favorites = {
        
        path: curpath,
        hide: true,
        item: null,
        load: false,
        
        _storageKey: "codiad.plugin.favorites",
        
        /**
         * Init
         * @name init
         */
        init: function() {
            var _this = this;
            $.get(this.path+"template.html", function(data){
                $('#side-projects').before(data);
                //Set hidelistener
                $('#favorites-collapse').live('click', function(){
                    if (_this.hide) {
                        $('.favorites').hide();
                        $('.favorites-hr').hide();
                        $('#favorites-collapse').removeClass('icon-down-dir');
                        $('#favorites-collapse').addClass('icon-up-dir');
                        _this.hide = false;
                        //Set height
						$('.favorites-sb').css("height","35px");
                    } else {
                        $('.favorites').show();
                        $('.favorites-hr').show();
                        $('#favorites-collapse').removeClass('icon-up-dir');
                        $('#favorites-collapse').addClass('icon-down-dir');
                        _this.hide = true;
                        //Set height
						$('.favorites-sb').css("height","100px");
                    }
                    _this.resize();
                });
                //Load favorites, but only if settings already loaded
                if (_this.load) {
                    _this.__loadLocalStorageItems();
                } else {
                    _this.load = true; //wait for settings to be loaded
                }
            });
            $('.favorite-item').live('click', function(e){
				if (codiad.editor.settings.fileManagerTrigger) {
					_this.jump($(this).find('a'));
				}
            });
            $('.favorite-item').live('dblclick', function(e){
				if (!codiad.editor.settings.fileManagerTrigger) {
					_this.jump($(this).find('a'));
				}
            });
            $('.favorite-item img').live('click', function(){
                _this.__removeFromLocalStorage($(this).parent().find('a'));
				var parent = $(this).parent();
				$(parent).remove();
            });
            //Amplify
            amplify.subscribe('filemanager.onIndex', function(obj){
				if (_this.item !== null) {
					if (_this.startsWith(_this.item.path,obj.path)) {
						setTimeout(function(){
							if (_this.item.parts.length > _this.item.index) {
								codiad.filemanager.rescan(_this.item.parts[_this.item.index]);
								_this.item.index++;
							} else {
								_this.item = null;
							}
						}, 50);
					}
				}
            });
            amplify.subscribe('settings.loaded', function(obj){
                if (_this.load) {
                    _this.__loadLocalStorageItems();
                } else {
                    _this.load = true; //wait for template to be loaded
                }
            });
            //Prjects resizing - Get current and replace them
            var collapse    = codiad.project.projectsCollapse;
            var expand      = codiad.project.projectsExpand;
            codiad.project.projectsCollapse = function() {
				collapse();
				_this.resize();
				codiad.project._sideExpanded = false;
            };
            codiad.project.projectsExpand = function() {
				expand();
				_this.resize();
				codiad.project._sideExpanded = true;
            };
        },
        
        /**
         * Add folder to favorites
         * @name add
         * @param {string} path Path of folder
         */
        add: function(path) {
            var element = $('a[data-path="'+path+'"]');
            var name    = $(element).text();
            var project = $('#project-root').attr('data-path');

            this.__addToLocalStorage(path, name, project);
            this.__add(path, name, project);
        },
        
        /**
         * Add folder to favorites
         * @name add
         * @param {string} path Path of folder
         * @param {string} name Foldername
         * @param {string} project Poject of folder
         * @private
         */
        __add: function(path, name, project) {
            var item    = '<li class="favorite-item"><img src="'+this.path+"remove.png"+'"></img>';
                item   +='<a class="directory open" data-favorite-path="'+path+'" data-favorite-project="'+project+'">'+name+'</a></li>';
            $('#favorites-list').append(item);
        },
        
        /**
         * Add folder to localStorage
         * @name __addToLocalStorage
         * @param {string} path Path of folder
         * @param {string} name Foldername
         * @param {string} project Poject of folder
         * @private
         */
        __addToLocalStorage: function(path, name, project) {
            var list = localStorage.getItem(this._storageKey) || "[]";
            list = JSON.parse(list);
            
            list.push({path: path, name: name, project: project});
            list = JSON.stringify(list);
            localStorage.setItem(this._storageKey, list);
            //Call system sync
            codiad.settings.save();
        },
        
        /**
         * Remove folder from localStorage
         * @name __removeFromLocalStorage
         * @param {jQuery object} item Favorite entry that to remove
         * @private
         */
        __removeFromLocalStorage: function(item) {
            var path = $(item).attr('data-favorite-path');
            var list = localStorage.getItem(this._storageKey);
            if (list === null) {
                return;
            } else {
                list = JSON.parse(list);
            }
            var index = -1;
            for (var i = 0; i < list.length; i++) {
                if (list[i].path === path) {
                    index = i;
                    break;
                }
            }
            if (index < 0) {
                return;
            }
            if (list.length === 1) {
                list = []; //Workaround
            } else {
                list.splice(index, 1);
            }
            list = JSON.stringify(list);
            localStorage.setItem(this._storageKey, list);
            //Call system sync
            codiad.settings.save();
        },
        
        /**
         * Load favorites from localStorage and add them
         * @name __loadLocalStorageItems
         * @private
         */
        __loadLocalStorageItems: function() {
            var list = localStorage.getItem(this._storageKey) || "[]";
            list = JSON.parse(list);
            for (var i = 0; i < list.length; i++) {
                this.__add(list[i].path, list[i].name, list[i].project);
            }
        },
        
        /**
         * Jump to folder
         * @name jump
         * @param {jQuery object} item jQuery object of target
         */
        jump: function(item) {
			var path = $(item).attr('data-favorite-path');
			var project = $(item).attr('data-favorite-project');
			var current = codiad.project.getCurrent();
			this.item = this.splitPath(path,project);
			if (!this.startsWith(path, current)) {
				codiad.project.open(project);
			} else {
				if (this.item.parts.length !== 0) {
					codiad.filemanager.rescan(this.item.parts[0]);
					this.item.index = 1;
				}
			}
        },
        
        /**
         * Start string with a needle
         * @name startsWith
         * @param {string} string String to search in
         * @param {string} needle Needle to search for
         * @returns {bool}
         */
        startsWith: function(string, needle) {
			if (string.indexOf(needle) === 0) {
				return true;
			} else {
				return false;
			}
        },
         /**
          * Splits path in parts for sequential rescan
          * @name splitPath
          * @param {string} path File path
          * @param {string} project Project path
          * @returns {bool/object} Returns info object or false on failure
          */
        splitPath: function(path, project) {
			if (this.startsWith(path,project)) {
				var result  = {path: path, project: project, index: 0};
				path        = path.replace(project, "");
				if (this.startsWith(path,"/")) {
					path = path.replace("/", "");
				}
				var parts   = path.split("/");
				if (parts.length !== 0) {
					var buffer  = project + "/" + parts[0];
					parts[0]    = buffer;
					for (var i = 1; i < parts.length; i++) {
						buffer     += "/"+parts[i];
						parts[i]    = buffer;
					}
					for ( i = 0; i < parts.length; i++) {
						if (this.isAtEnd(parts[i], "/")) {
							parts[i] = parts[i].substring(0, parts[i].length-1);
						}
					}
				}
				result.parts = parts;
				return result;
			} else {
				return false;
			}
        },
        
        /**
         * Resize favorite area
         * @name resize
         */
        resize: function() {
            var projectSize = $('.sb-left-projects').height();
            var favoritesSize = $('.favorites-sb').height();
			$('.favorites-sb').css("bottom", projectSize+"px");
			$('.sb-left-content').css("bottom", projectSize+favoritesSize+"px");
        },
        
        /**
         *
         * Test if item is at the end of string
         * @name isAtend
         * @param {string} string String to search in
         * @param {String} item Item to search for
         *
         */
        isAtEnd: function(string, item) {
            var pos = string.lastIndexOf(item);
            if (pos != -1) {
                var part = string.substring(pos);
                if (part === item) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        }
    };
})(this, jQuery);
