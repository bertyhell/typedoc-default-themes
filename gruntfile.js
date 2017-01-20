module.exports = function (grunt) {
  var themes = ['default', 'rich'];

  function tsFiles() {
    var files = {};

    themes.forEach(theme => {
      files['src/' + theme + '/assets/js/main.js'] = ['src/' + theme + '/assets/js/src/**/*.ts'];
    });

    return files;
  }

  function uglifyFiles() {
    var files = {};

    themes.forEach(theme => {
      files['src/' + theme + '/assets/js/main.js'] = [
        'src/' + theme + '/assets/js/lib/jquery-2.1.1.min.js',
        'src/' + theme + '/assets/js/lib/underscore-1.6.0.min.js',
        'src/' + theme + '/assets/js/lib/backbone-1.1.2.min.js',
        'src/' + theme + '/assets/js/lib/lunr.min.js',
        'src/' + theme + '/assets/js/main.js'
      ];
    });

    return files;
  }

  function copyFiles() {
    var files = [];

    themes.forEach(theme => {
      files.push({
        expand: true,
        cwd: 'src/' + theme,
        src: ['**/*.hbs', '**/*.png'],
        dest: 'bin/' + theme
      });
    });

    return files;
  }

  function replacements() {
    var replacements = [];

    themes.forEach(theme => {
      replacements.push({
        pattern: /{{ CSS }}/g,
        replacement: function () {
          var css = grunt.file.read('bin/' + theme + '/assets/css/main.css');
          return css.replace(/url\(([^)]*)\)/g, function (match, file) {
            if (match.indexOf(':') != -1) return match;
            var path = require('path'), fs = require('fs');
            var file = path.resolve('bin/' + theme + '/assets/css', file);
            var data = fs.readFileSync(file, 'base64');
            return 'url(data:image/png;base64,' + data + ')';
          });
        }
      });

      replacements.push({
        pattern: /{{ JS }}/g,
        replacement: function () {
          return grunt.file.read('bin/' + theme + '/assets/js/main.js').replace('{{', '{/**/{');
        }
      });
    });

    return replacements;
  }

  function sassFiles() {
    var files = [];

    themes.forEach(theme => {
      files.push({
        expand: true,
        cwd: 'src/' + theme + '/assets/css',
        src: '**/*.sass',
        dest: 'bin/' + theme + '/assets/css',
        ext: '.css'
      });
    });

    return files;
  }

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    ts: {
      options: {
        sourceMap: false,
        module: 'amd',
        basePath: 'themes',
        declaration: false
      },
      allThemes: {
        files: tsFiles()
      }
    },
    uglify: {
      options: {
        mangle: false
      },
      allThemes: {
        files: uglifyFiles()
      }
    },
    'string-replace': {
      themeMinimal: {
        files: {
          'bin/minimal/layouts/default.hbs': ['src/minimal/layouts/default.hbs']
        },
        options: {
          replacements: replacements()
        }
      }
    },
    sass: {
      options: {
        sourcemap: 'auto',
        style: 'compact',
        unixNewlines: true
      },
      allThemes: {
        files: sassFiles()
      }
    },
    postcss: {
      options: {
        map: true,
        processors: [
          require('autoprefixer')({browsers: 'last 2 versions'}),
          require('cssnano')()
        ]
      },
      dist: {
        src: 'bin/**/*.css'
      }
    },
    copy: {
      plugin: {
        files: [{
          expand: true,
          cwd: 'src',
          src: ['*.js'],
          dest: 'bin'
        }]
      },
      allThemes: {
        files: copyFiles()
      },
      themeDefault2Minimal: {
        files: [{
          expand: true,
          cwd: 'src/default/partials',
          src: ['**/*.hbs'],
          dest: 'bin/minimal/partials'
        }]
      },
      themeMinimal: {
        files: [{
          expand: true,
          cwd: 'src/minimal',
          src: ['**/*.hbs'],
          dest: 'bin/minimal'
        }]
      }
    },
    watch: {
      js: {
        files: ['src/default/assets/js/src/**/*.ts', 'src/rich/assets/js/**/*'],
        tasks: ['js']
      },
      css: {
        files: ['src/default/assets/css/**/*', 'src/rich/assets/css/**/*'],
        tasks: ['css']
      },
      allThemes: {
        files: ['src/default/**/*.hbs', 'src/rich/**/*.hbs'],
        tasks: ['copy', 'string-replace']
      },
      // default: {
      //   files: ['src/default/**/*.hbs'],
      //   tasks: ['copy', 'string-replace']
      // },
      minimal: {
        files: ['src/minimal/partials/**/*.hbs', 'src/minimal/templates/**/*.hbs'],
        tasks: ['copy:themeMinimal']
      },
      minimalLayout: {
        files: ['src/minimal/layouts/default.hbs'],
        tasks: ['string-replace:themeMinimal']
      }
    }
  });


  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-string-replace');
  grunt.loadNpmTasks('grunt-postcss');
  grunt.loadNpmTasks('grunt-ts');

  grunt.registerTask('css', ['sass', 'postcss']);
  grunt.registerTask('js', ['ts:allThemes', 'uglify']);
  grunt.registerTask('default', ['copy', 'css', 'js', 'string-replace']);
};
