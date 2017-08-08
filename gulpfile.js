var gulp = require('gulp');
var concat = require('gulp-concat');
var babel = require('gulp-babel');
var minify = require('gulp-uglify');

gulp.task('watch', function() {
    gulp.watch('jsx/**/*.jsx', ['deploy']);
});
 
gulp.task('default', function () {
    return gulp.src(['jsx/server.jsx', 'jsx/**/*.jsx'])
        .pipe(babel({
            presets: ['es2015', 'react'],
            presets: ['react'],
        }))
        .on('error', function(error) {
            console.log(error.toString());
            this.emit('end');
        })
        .pipe(concat('app.js'))
        .pipe(gulp.dest('public_html/js'));
});

gulp.task('deploy', ['default'], function() {
    return gulp.src(["public_html/js/begin.js", "public_html/js/app.js", "public_html/js/end.js"])
        .pipe(concat('app.min.js'))
        .pipe(minify())
        .pipe(gulp.dest("public_html/js"))
});

