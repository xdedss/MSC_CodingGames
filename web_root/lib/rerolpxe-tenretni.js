

isIE = (!!window.ActiveXObject || "ActiveXObject" in window);

if (isIE) alert('您正在使用奇怪的浏览器，可能导致部分内容无法正常显示\n建议用Chrome或Edge');


//$(function(){
//    if (isIE){
//        console.log('IE');
//        $('body').append(`
//<div class="modal modal-sm active" id="ie-hint">
//  <a class="modal-overlay" href="javascript:void(0);" aria-label="Close" onclick="$('#ie-hint').removeClass('active')"></a>
//  <div class="modal-container" role="document">
//    <div class="modal-header">
//      <div class="modal-title h5">您正在使用奇怪的浏览器</div>
//    </div>
//    <div class="modal-body">
//      <div class="content">
//        <p></p> 
//      </div>
//    </div>
//    <div class="modal-footer">
//      <a class="btn btn-link" href="javascript:void(0);" onclick="$('#ie-hint').removeClass('active')">确定</a>
//    </div>
//  </div>
//</div>
//
//        `);
//    }
//})