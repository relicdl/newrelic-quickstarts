'use strict';
const core = require('@actions/core');
const isImage = require('is-image');
const {
  getImageCount,
  getFileSize,
  getFileExtension,
  globFiles,
  isDirectory,
} = require('./helpers');

const BASE_PATH = '../packs/';
const MAX_SIZE = 4000000;
const MAX_NUM_IMG = 6;
const ALLOWED_IMG_EXT = ['.png', '.jpeg', '.jpg', '.svg'];

/**
 * Validate all folders contain no more than MAX_NUM_IMG images
 * @param {Array} files - The array of globbed file names
 * @returns {boolean} Whether there are directories with more than MAX_NUM_IMG
 */
const checkImageCounts = (files) => {
  const directories = files
    .filter((file) => isDirectory(file))
    .filter((folder) => {
      return getImageCount(folder) > MAX_NUM_IMG;
    })
    .map((folder) => {
      return {
        folder,
        imageCount: getImageCount(folder),
      };
    });
  if (directories.length > 0) {
    core.setFailed('Components should contain less than 6 images');
    console.warn(`\nPlease check the following directories:`);
    directories.map((dir) => console.warn(dir));
    return false;
  }
  return true;
};

/**
 * Validates that files are below MAX_SIZE
 * @param {Array} globbedFiles - The array of globbed file names
 * @returns {boolean} Whether there are any files over MAX_SIZE
 */
const checkFileSizes = (globbedFiles) => {
  const sizes = globbedFiles
    .filter((file) => isImage(file))
    .filter((file) => {
      return getFileSize(file) > MAX_SIZE;
    })
    .map((file) => {
      return {
        file,
        size: `${getFileSize(file) / 1000000}MB`,
      };
    });
  if (sizes.length > 0) {
    core.setFailed(`Images should be under ${MAX_SIZE / 1000000}MB:`);
    console.warn(`\nPlease check the following images:`);
    sizes.map((file) => console.warn(file));
    return false;
  }
  return true;
};

/**
 * Validates images are one of the ALLOWED_IMG_EXT
 * @param {Array} globbedFiles - The array of globbed file names
 * @returns {boolean} Whether there are files not in ALLOWED_IMG_EXT
 */
const checkImageExtensions = (globbedFiles) => {
  const extensions = globbedFiles
    .filter((file) => isImage(file))
    .filter((file) => {
      return !ALLOWED_IMG_EXT.includes(getFileExtension(file));
    });
  if (extensions.length > 0) {
    core.setFailed(`Images should be of format ${[...ALLOWED_IMG_EXT]}:`);
    console.warn(`\nPlease check the following images:`);
    extensions.map((file) => console.warn(file));
    return false;
  }
  return true;
};

const main = () => {
  const globbedFiles = globFiles(BASE_PATH);
  const imageCounts = checkImageCounts(globbedFiles);
  const fileSizes = checkFileSizes(globbedFiles);
  const imageExtensions = checkImageExtensions(globbedFiles);

  if (!imageCounts || !fileSizes || !imageExtensions) {
    process.exit(1);
  }
};

/**
 * This allows us to check if the script was invoked directly from the command line, i.e 'node validate_packs.js', or if it was imported.
 * This would be true if this was used in one of our GitHub workflows, but false when imported for use in a test.
 * See here: https://nodejs.org/docs/latest/api/modules.html#modules_accessing_the_main_module
 */
if (require.main === module) {
  main();
}

module.exports = { checkImageCounts, checkImageExtensions, checkFileSizes };
