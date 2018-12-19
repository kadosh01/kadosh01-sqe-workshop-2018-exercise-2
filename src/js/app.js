import $ from 'jquery';
import {parseCode} from './code-analyzer';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let functionArgs = $('#input2').val();
        let ans =  parseCode(codeToParse,functionArgs);
        let myhtml = ans['html'];
        document.getElementById('parsedCode').innerHTML = myhtml;
    });
});
