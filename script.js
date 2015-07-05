
angular.module('heimdall', ['ui.router'])
.constant("ATN", {
  "API_URL": "https://infinite-forest-1836.herokuapp.com"
})
.config(function($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise("/");
  $stateProvider
    .state('home', {
      url: "/home",
      templateUrl: "list.html",
      controller: 'MainCtrl'
    })
    .state("login", {
      url:"/",
      templateUrl: "login.html",
      controller: "LoginCtrl"
    })
    .state('404', {
      url: "/404",
      templateUrl: "404.html"
    })
    .state('new', {
      url: "/new",
      templateUrl: "new.html",
      controller: "NewQuestionCtrl"
    })
    .state('question', {
      url: "/:slug",
      templateUrl: "question.html",
      controller: "QuestionCtrl",
    })
})
.directive("inputForm", function(){
  return {
    templateUrl: "form.html"
  };
})
.service("AuthService", function($state, $rootScope){
  var ref = new Firebase("https://answer.firebaseio.com/");
  this.createUser = function(newUserEmail, newUserPassword) {
    ref.createUser({
      email: newUserEmail,
      password: newUserPassword
    }, function(error, userData){
      if (error){
        console.log("Error creating user:", error);
      } else {
        console.log("successfully created user account");
      }
    });
  };
  this.loginUser = function(userEmail, userPassword){
    ref.authWithPassword({
      email: userEmail,
      password: userPassword
    }, function(error, userData) {
      if(error){
        console.error("Error logging in:", error);
        $rootScope.activeUser = userEmail;
      } else {
        console.log(userData);
        $state.go("home");
      }
    });
  };
  this.logOut = function() {
    ref.unauth();
    $state.go("login");
    console.log("log out");
  };
  this.onAuth = function() {
    ref.onAuth(function(authData){
      if (authData) {
        console.log("Authenticated with uid:", authData.uid);
        console.log(authData.password.email);
        $rootScope.activeUser = authData.password.email;
      } else {
        console.log("Client unauthenticated.");
        $rootScope.activeUser = null;

      }
    });
  };
  // this.isAuthorizeUser = function() {
  //   // $rootScope.activeUser ===
  // }
})
.factory('Question', function($http, ATN) {
  return {
    getOne: function(slug) {
      return $http.get(ATN.API_URL + "/questions/" + slug);
    },
    getAll: function() {
      return $http.get(ATN.API_URL + "/questions");
    },
    addQuestion: function(newQuestion) {
      return $http.post(ATN.API_URL + "/questions", newQuestion);
    },
    editQuestion: function(slug, updatedQuestion) {
      console.log(slug,updatedQuestion)
      return $http.patch(ATN.API_URL + "/questions/" + slug, updatedQuestion);
    },
    deleteQuestion: function(slug) {
      return $http.delete(ATN.API_URL + "/questions/" + slug);
    }
  };
})
.factory('Answer', function($http, ATN) {
  var answers = {};

  return {
    getAll: function(slug) {
      answers[slug] = answers[slug] || [];
      return answers[slug];
    },
    addAnswer: function(slug, newAnswer) {
      answers[slug].push(newAnswer);
      // return $http.post(ATN.API_URL + "/questions", newQuestion);
    }
  };
})
.filter("dateInWords", function() {
  return function(input) {
    return moment(input).utc().fromNow();
  };
})
.controller('NewQuestionCtrl', function($scope, Question, $state, $rootScope){
  $scope.askQuestion = function() {
    $scope.question.email = $rootScope.activeUser;
    Question.addQuestion($scope.question)
      .success(function(data) {
        $scope.question = {};
        $state.go("home");
      })
      .catch(function(err) {
        console.error(err);
      });
  };
})
.controller('QuestionCtrl', function($scope,$rootScope, Question, Answer, $state, AuthService){
  $scope.slug = $state.params.slug;

  $scope.answers = Answer.getAll($scope.slug);

  Question.getOne($state.params.slug)
    .success(function(data) {
      $scope.question = data;
    }).catch(function(err) {
      console.error(err);
      $state.go("404");
    });

  $scope.addAnswer = function() {
    $scope.answer.email = $rootScope.activeUser;
    Answer.addAnswer($scope.slug, $scope.answer);
    $scope.answer = {};
  };

  $scope.submitEditQuestion = function() {
    $scope.answer.email = $rootScope.activeUser;
    Question.editQuestion($state.params.slug, $scope.answer)
      .success(function(data){
        $state.go("home");
        console.log(data);
      }).catch(function (err) {
        console.error(err);
      });
  };
  $scope.deleteQuestion = function() {
    Question.deleteQuestion($state.params.slug)
      .success(function(data){
        $state.go("home");
        console.log(data);
      }).catch(function (err) {
        console.error(err);
      });
  };
})
.controller('MainCtrl', function($scope, Question, AuthService,$rootScope){
  AuthService.onAuth();
  Question.getAll().success(function(data) {
    $scope.questions = data;
  }).catch(function(err) {
    console.error(err);
  });
  $scope.logOut = function(){
    AuthService.logOut();
    $rootScope.activeUser = null;
  };
})
.controller("LoginCtrl", function($scope, AuthService){
  $scope.login = function() {
    AuthService.loginUser($scope.user.email, $scope.user.password);
  };
  $scope.createUser = function() {
    AuthService.createUser($scope.newUser.email, $scope.newUser.password);
  };
});
