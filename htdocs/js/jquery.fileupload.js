$(function() {
    // this variable is just so we can map the label to its input
    // it is not the same as the file id
    var _uiCounter = 0;

    // hide the upload button, we'll have another one for saving descriptions
    $("input[type=submit]").hide();

    var newField = function(label, name) {
        var fieldIdentifier = name + _uiCounter;
        return '<div class="row">' +
                    '<div class="large-2 columns">' +
                        '<label for="' + fieldIdentifier + '" class="inline">' + label + '</label>' +
                    '</div>' +
                    '<div class="large-10 columns">' +
                        '<input type="text" name="' + name + '" id="' + fieldIdentifier + '"/>' +
                    '</div>' +
                '</div>'
    };

    $("#fileupload").fileupload({
        dataType: 'json',
        url: Site.siteroot + '/api/v1/file/new',

        autoUpload: false,

        previewMaxWidth: 800,
        previewMaxHeight: 800
    })
    .on( 'fileuploadadd', function(e, data) {
        for ( var i = 0, f; f = data.files[i]; i++ ) {
            if ( f.type && f.type.indexOf( 'image') !== 0 ) return;

            // show the file preview and let the user upload metadata
            data.context = $( '<li class="row">' +
                '<div class="large-3 columns image-preview">' +
                    '<div class="progress large-8 success"><span class="meter" style="width:0"></span></div>' +
                '</div>' +
                '<div class="large-9 columns">' +
                newField("Title", "title") +
                newField("Description", "description") +
                newField("Alt Text", "alttext") +
                '</div></li>' ).appendTo("#filepreview ul");
            _uiCounter++;

            data.formData = {};
            data.submit();


            // }).fail( function() {
            //     // TODO: error handling
            // })
        }

        // and then add a button to save metadata
        $("input[type=submit]").val( "Save Descriptions" ).show();
    })
    .on( 'fileuploaddone', function( e, data ) {
        var response = data.result;

        if ( response.success ) {
            var fileid = response.result.id;

            data.context
                // update the form field names to use this image id
                .find(":input").prop( "name", function(i, name){
                    this.name = name + "_" + fileid;
                })

                // and make it easier for us to figure out the form fields we expect to work with
                // (we don't want fileids_### on this one)
                .end().append( "<input type='hidden' name='fileids' value='" + fileid +"' />");
        }

        // TODO: error-handling
    })
    .on( 'fileuploadfail', function( e, data) {
        // TODO: error-handling
    })
    .on( 'fileuploadprocessalways', function( e, data ) {
        var index = data.index;
        var $node = data.context;

        if ( ! $node ) return;

        $node.find( ".image-preview").prepend( data.files[index].preview );
    })
    .on( 'fileuploadprogress', function (e, data) {
       var progress = parseInt(data.loaded / data.total * 100, 10);
       data.context.find( ".meter" ).css( 'width', progress + '%' );
    });
});