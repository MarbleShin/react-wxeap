'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = compressImage;
/**
   * Detecting vertical squash in loaded image.
   * Fixes a bug which squash image vertically while drawing into canvas for some images.
   * This is a bug in iOS6 devices. This function from https://github.com/stomita/ios-imagefile-megapixel
   * With react fix by n7best
   */
function detectVerticalSquash(img) {
    var data = void 0;
    var ih = img.naturalHeight;
    var canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = ih;
    var ctx = canvas.getContext('2d');
    if (!ctx) {
        return 1;
    }
    ctx.drawImage(img, 0, 0);
    try {
        // Prevent cross origin error
        data = ctx.getImageData(0, 0, 1, ih).data;
    } catch (err) {
        return 1;
    }
    // search image edge pixel position in case it is squashed vertically.
    var sy = 0;
    var ey = ih;
    var py = ih;
    while (py > sy) {
        var alpha = data[(py - 1) * 4 + 3];
        if (alpha === 0) {
            ey = py;
        } else {
            sy = py;
        }
        py = ey + sy >> 1;
    }
    var ratio = py / ih;
    return ratio === 0 ? 1 : ratio;
}

/**
 * 压缩图片
 * @param {string} src 
 * @param {number} maxWidth 
 * @param {func} cb 
 */
function compressImage(src, orientation, maxWidth, cb) {
    var _arguments = arguments;

    var img = new Image();
    img.onload = function () {
        var w = Math.min(maxWidth, img.width);
        var h = img.height * (w / img.width);
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');

        if (ctx) {
            var drawImage = ctx.drawImage;
            ctx.drawImage = function (_img, sx, sy, sw, sh, dx, dy, dw, dh) {
                var vertSquashRatio = 1;
                // Detect if img param is indeed image
                if (!!_img && _img.nodeName === 'IMG') {
                    vertSquashRatio = detectVerticalSquash(_img);
                    if (typeof sw === 'undefined') {
                        sw = _img.naturalWidth;
                    }
                    if (typeof sh === 'undefined') {
                        sh = _img.naturalHeight;
                    }
                }
                // Execute several cases (Firefox does not handle undefined as no param)
                // by call (apply is bad performance)
                if (_arguments.length === 9) {
                    drawImage.call(ctx, _img, sx, sy, sw, sh, dx, dy, dw, dh / vertSquashRatio);
                } else if (typeof sw !== 'undefined') {
                    drawImage.call(ctx, _img, sx, sy, sw, sh / vertSquashRatio);
                } else {
                    drawImage.call(ctx, _img, sx, sy);
                }
            };

            canvas.width = w;
            canvas.height = h;
            ctx.drawImage(img, 0, 0, w, h);
            switch (orientation) {
                case 6:
                    //需要顺时针（向左）90度旋转  
                    rotateImg(img, 'left', canvas);
                    break;
                case 8:
                    //需要逆时针（向右）90度旋转  
                    rotateImg(img, 'right', canvas);
                    break;
                case 3:
                    //需要180度旋转  
                    rotateImg(img, 'right', canvas); //转两次  
                    rotateImg(img, 'right', canvas);
                    break;
            }
            // get image type
            var type = src.substring(src.indexOf(':') + 1, src.indexOf(';'));
            var base64Url = canvas.toDataURL(type);
            cb(base64Url);
        }
    };
    img.src = src;
}

//对图片旋转处理   
function rotateImg(img, direction, canvas) {
    //最小与最大旋转方向，图片旋转4次后回到原方向    
    var min_step = 0;
    var max_step = 3;
    //let img = document.getElementById(pid);    
    if (img == null) return;
    //img的高度和宽度不能在img元素隐藏后获取，否则会出错    
    var height = img.height;
    var width = img.width;
    //let step = img.getAttribute('step');    
    var step = 2;
    if (step == null) {
        step = min_step;
    }
    if (direction == 'right') {
        step++;
        //旋转到原位置，即超过最大值    
        step > max_step && (step = min_step);
    } else {
        step--;
        step < min_step && (step = max_step);
    }
    //旋转角度以弧度值为参数    
    var degree = step * 90 * Math.PI / 180;
    var ctx = canvas.getContext('2d');
    switch (step) {
        case 0:
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0);
            break;
        case 1:
            canvas.width = height;
            canvas.height = width;
            ctx.rotate(degree);
            ctx.drawImage(img, 0, -height);
            break;
        case 2:
            canvas.width = width;
            canvas.height = height;
            ctx.rotate(degree);
            ctx.drawImage(img, -width, -height);
            break;
        case 3:
            canvas.width = height;
            canvas.height = width;
            ctx.rotate(degree);
            ctx.drawImage(img, -width, 0);
            break;
    }
}