const Course = require('app/models/Course');
const controller = require('app/http/controllers/controller');
const fs = require('fs');
const faker = require('faker');
const { Console } = require('console');
const Episode = require('../../../models/episode');


class CourseController extends controller {
  async index(req, res) {

    //faker
    // for (let i = 0; i < 50; i++) {
    //   const addCourse = new Course({
    //     user: req.user._id,
    //     title: faker.name.title(),
    //     body: faker.lorem.text(),
    //     slug: faker.lorem.slug(),
    //     type: 'free',
    //     price: faker.commerce.price(),
    //     image: faker.image.imageUrl(),
    //     tags: faker.lorem.words()
    //   })

    //   addCourse.save();
    // }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    try {
      //const courses = await Course.paginate(page, limit);
      const courses = await Course.paginate({}, { page, limit: 10, sort: { createAt: 1 } });
      //return res.json(courses);
      res.render('admin/course/index', { courses });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async show(req, res) {
    try {
      const course = await Course.findById(req.params.id);
      res.render('admin/course/show', { course });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  create(req, res) {
    try {
      res.render('admin/course/create', { errors: req.flash('errors') });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  async post(req, res) {
    const validatedData = await this.validationForm(req, res)

    // اگر عکس وجود داشت
    // if (req.body.image) {
    //   req.body.image = req.body.path.substr(6);
    // }

    // اگر دیتاها معتبر بود
    if (validatedData) {
      req.body.image = req.body.path;
      req.body.user = req.user._id;
      const course = new Course(req.body);
      try {
        const newCourse = await course.save();
        res.redirect('/admin/course');
      } catch (err) {
        //res.render('admin/course/create');
        this.back(req, res);
      }
    } else {
      var imageSizes = req.body.path;
      // اگر دیتای فرم معتبر نبود عکس آپلود شده مجددا حذف شود
      setTimeout(() => {
        if (imageSizes && imageSizes.original) {
          for (var key in imageSizes) {
            if (imageSizes.hasOwnProperty(key)) {
              fs.unlinkSync('public' + imageSizes[key], (err) => {
                if (err) {
                  console.error('Error deleting file:', err);
                } else {
                  console.log('File deleted successfully');
                }
              });
            }
          }
        }
      }, 1000); // Delay of 1000 milliseconds
      //res.render('admin/course/create');
      this.back(req, res);
    }
  }

  async edit(req, res) {
    try {
      const course = await Course.findById(req.params.id);
      res.render('admin/course/edit', { errors: req.flash('errors'), course: course });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async update(req, res) {
    const validatedData = this.validationForm(req, res);

    if (validatedData) {
      try {
        const deleteImagesUpdateCourse = await Course.findById(req.params.id);
        // Delete the associated image
        if (deleteImagesUpdateCourse.image) {
          // Remove the images file from the file system
          Object.keys(deleteImagesUpdateCourse.image).forEach(function (key, index) {
            fs.unlinkSync('public' + deleteImagesUpdateCourse.image[key]);
          });

        }

        req.body.image = req.body.path;
        const updatedCourse = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.redirect('/admin/course');
      } catch (err) {
        res.render('admin/course/edit');
      }
    } else {

      // اگر دیتای فرم معتبر نبود عکس آپلود شده مجددا حذف شود
      if (req.file) {
        var imageSizes = req.body.path;
        // اگر دیتای فرم معتبر نبود عکس آپلود شده مجددا حذف شود
        setTimeout(() => {
          if (imageSizes && imageSizes.original) {
            for (var key in imageSizes) {
              if (imageSizes.hasOwnProperty(key)) {
                fs.unlinkSync('public' + imageSizes[key], (err) => {
                  if (err) {
                    console.error('Error deleting file:', err);
                  } else {
                    console.log('File deleted successfully');
                  }
                });
              }
            }
          }
        }, 1000); // Delay of 1000 milliseconds
      }




      this.back(req, res);
    }

  }

  async delete(req, res) {
    try {
      const courseId = req.params.id;

      // Delete the episodes related to the course
      await Episode.deleteMany({ course: courseId });

      const deletedCourse = await Course.findByIdAndDelete(courseId);
      //const deletedCourse = await Course.findById(courseId).populate('episodes').exec();

      if (!deletedCourse) {
        return res.status(404).json({ message: 'همچین دوره ای وجود ندارد' });
      }
      //return res.json(deletedCourse)
      // Delete the course episodes
      //deletedCourse.episodes.forEach(episode => console.log(episode));
      //deletedCourse.remode();

      // Delete the associated image
      if (deletedCourse.image) {
        // Remove the images file from the file system
        Object.keys(deletedCourse.image).forEach(function (key, index) {
          fs.unlinkSync('public' + deletedCourse.image[key]);
        });

      }
      res.redirect('/admin/course');
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

}

module.exports = new CourseController();