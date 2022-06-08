// Eric's code for Ben
 $('.startQuiz_btn').click(function (e) {
  $('.aem-Grid > .aem-GridColumn.aem-GridColumn--default--none.onupquiz').show();
  $('.onupQuiz-intro, #mm-quiz-callout').hide();
  $('.question-container').slideDown("linear");
  var cData = new Object();
  cData.events = "event38";
  cData.toolFlowName = $("#toolFlowName").val();
  marTech.trackAction(cData);
  setTimeout(function () {
   quizContainerElement = document.querySelector(".quiz-container");
   quizContainerElement.scrollIntoView();
  }, 200);
 });