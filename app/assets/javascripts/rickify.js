$(document).ready(function() {

  /////////////////////////
  // Upload to cloudinary, then give the url returned to the FRS.
  $(".cloudinary-fileupload")
    .cloudinary_fileupload({
      start: function (e) {
        $(".status").text("Starting upload...");
      },
      progress: function (e, data) {
        $(".status").text("Uploading... " + Math.round((data.loaded * 100.0) / data.total) + "%");
      },
      fail: function (e, data) {
        $(".status").text("Upload failed");
      }
    })
    .off("cloudinarydone").on("cloudinarydone", function (e, data) {
      image_url_to_frs(data.result.url)
    });
  });

  /////////////////////////
  // Make an ajax request to hit FRS ajax in the controller
  function image_url_to_frs(address) {
    console.log('frsing image');
    $.ajax({
      "url": "/frs",
      "method": "GET",
      data: {address: address}
    }).done(function(data){
      console.log(data)
      rickifier(data, address)
    })
  }

  /////////////////////////
  // The last step: Upload rickifed image's url to db
  // Worse comes to worse, stick an ajax call here to the create path, include data
  // Note: Moving this function to the bottom of the js seems to make file dialaog
  // work, but uploading to break.
  function image_pubid_to_upload(address, format, redirtag) {
    console.log('uploading image');
    $.ajax({
      "url": "/pictures/upload",
      "method": "post",
      "data": { "address": address, "format": format, "redirtag": redirtag},
      "success": function(){
        console.log("woo")
      }
    })
  }

  /////////////////////////
  // The rickifer!
  // Combining images using canvas
  // Credit: http://stackoverflow.com/questions/32068759/javascript-combine-images
  function rickifier(data, address) {
    var c = document.getElementById("myCanvas");
    var ctx = c.getContext("2d");
    $("#myCanvas").attr('width', data.image.width)
    $("#myCanvas").attr('height', data.image.height)
    var imageObj1 = new Image();
    var imageObj2 = new Image();
    imageObj1.setAttribute('crossOrigin', 'anonymous');
    imageObj2.setAttribute('crossOrigin', 'anonymous');
    imageObj1.src = address
    // Check for incorrect image profile:
    // Conditional to use if eyes arent returned/detected from the FRS
    if (data.faces[0].features.eyes===undefined) {
      var leftEyeX = data.faces[0].features.nose.x*.5
      var leftEyeY = data.faces[0].features.nose.y*.6
      var rightEyeX = data.faces[0].features.nose.x*2
      var rightEyeY = data.faces[0].features.nose.y*.2
      var browWidth = (rightEyeX*1.2)-leftEyeX
      var browHeight = data.faces[0].features.mouth.height*.7
    } else {
      // Otherwise use what we get
      var leftEyeX = data.faces[0].features.eyes[1].x*.95
      var leftEyeY = data.faces[0].features.eyes[1].y-data.faces[0].features.eyes[1].height*.90
      var rightEyeX = data.faces[0].features.eyes[0].x
      var rightEyeY = data.faces[0].features.eyes[0].y-data.faces[0].features.eyes[0].height*.90
      //add similar check for y coordinates
      if (leftEyeX > rightEyeX) {
        leftEyeX = data.faces[0].features.eyes[0].x
        rightEyeX = data.faces[0].features.eyes[1].x
      }
      var browWidth = (rightEyeX+data.faces[0].features.eyes[0].width)-leftEyeX*.85
      var browHeight = data.faces[0].features.eyes[0].height
    }

  /////////////////////////
  // Draw composite using coords from above
  // Credit: http://stackoverflow.com/questions/32068759/javascript-combine-images
  imageObj1.onload = function() {
    ctx.drawImage(imageObj1, 0, 0);
    imageObj2.src = "http://res.cloudinary.com/ds1rn0ryl/image/upload/v1473438420/hxk8ckcb54waw8e4tcr6.png";
    imageObj2.onload = function() {
      //rotate image before drawing object 2, counter-rotate after
      ctx.drawImage(imageObj2, leftEyeX, leftEyeY, browWidth, browHeight);
      // ctx.drawImage(imageObj2, 350, 250)
      var img = c.toDataURL("image/png");
      // Render canvas, and give it to cloudinary.
      $(".cloudinary-fileupload").cloudinary_upload_url(img).off("cloudinarydone").on("cloudinarydone", function(e, data){
        image_pubid_to_upload(data.result.public_id, data.result.format, 1)
      });
    }
  };


  // End of code
}
