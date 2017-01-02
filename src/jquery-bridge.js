/* start-build-ignore */
define(["jquery", "src/autosave"], function($, Autosave) {
/* end-build-ignore */

$.Autosave = Autosave;

$.fn.autosave = function(options) {
  return this.each(function() {
    new Autosave(this, options);
  });
};

/* start-build-ignore */
return $;

});
/* end-build-ignore */
