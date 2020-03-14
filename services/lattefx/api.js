/*
  Here is the problem:

  For synchronizing operation within a large web app, I personnally
  dislike things like vue-x and redux that are quite abstract
  for my 3 neurons.

  Ok here is the concept:

  ---------------------------------------------------------------

  What if developping for your app was like using a very nice API
  with nice documentation and access to method from different
  components using their names. Bonus points if we embed user
  documentation within the API.

  ---------------------------------------------------------------

  The API allows to register methods that can be called
  anywhere, from scripts or from the app code itself.

  To keep things organized, I suggest classes expose all
  there methods like this:

  If class UI exposes a method to create a window, for example,
  it should be named:

  ui.create-window

  So in general:

  <lowercase-module-name>.lowercase-function-name

  The API is a singleton, so wherever it is require()'d,
  it will be the same API where you can add more methods
  and call them.

*/

class API{

  constructor(){
    this.the_api = {};
  }

  expose(method_definition){
    /*
      The method definition is an object that contains:

      - name   : The name used to call this function
      - title  : Arbitarily formatted title
      - desc   : A quick summary of what the command does
      - doc    : A long string to document the method for
                the user

      - fn     : The actual function to call

      Optional:

      - argsdoc     : An array of strings documenting each arg
      - argsprompt  : The question strings to use when
                      interactively calling the method
    */

    // Make sure we have a name
    if(!("name" in method_definition)) return false;
    // Make sure we are self-documenting
    if(!("title" in method_definition)) return false;
    if(!("desc" in method_definition)) return false;
    if(!("doc" in method_definition)) return false;

    // Make sure we have a function to call
    if(!("fn" in method_definition)) return false;

    this.the_api[method_definition.name] = method_definition;
  }

  call(name, args){
    /* call an API method by name, with an argument array */
    args = args || [];

    if(!(name in this.the_api)){
      console.error("API method not defined (" + (name) + ")");
      return false;
    }

    this.the_api[name].fn.call(null, args);
  }

  doc(name){
    /* Return the documentation for an API method */

    return {
      name:  name,
      title: this.the_api[name].title,
      desc:  this.the_api[name].desc,
      doc:  this.the_api[name].doc
    };
  }

  index(){
    let index = this.the_api.keys();
  }

  list(){
    return this.the_api;
  }

}

window.API = new API();
