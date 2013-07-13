$(function() {
    // this variable is just so we can map the label to its input
    // it is not the same as the file id
    var _uiCounter = 0;

    var _hasUnsubmitted = false;

    // hide the upload button, we'll have another one for saving descriptions
    $("input[type=submit]").hide();

    var _doEditRequest = function( formFields ) {
        // handle submit via ajax instead
        $.ajax( Site.siteroot + '/api/v1/file/edit', {
            'type'      : 'POST',
            'dataType'  : 'json',

            'data'      : formFields
        } );
    };

    $(".upload-form-file-inputs")
        .find('input[type=file]')
            .attr( 'multiple', 'multiple' )
        .end()
        .find('.row')
            .append('<div class="large-12 columns"><div class="drop_zone">or drop images here</div></div>')
        .end()
    .fileupload({
        dataType: 'json',
        url: Site.siteroot + '/api/v1/file/new',

        autoUpload: false,

        previewMaxWidth: 800,
        previewMaxHeight: 800
    })
    .on( 'fileuploadadd', function(e, data) {
        var $output = $(".upload-form-preview ul");
        for ( var i = 0, f; f = data.files[i]; i++ ) {
            if ( f.type && f.type.indexOf( 'image') !== 0 ) return;

            // show the file preview and let the user upload metadata
            data.context = $($('#template-file-metadata').html())
                .appendTo( $output );

            data.context
                .find("label").attr( "for", function() {
                    return $(this).data("original-name") + _uiCounter;
                }).end()
                .find(":input").attr( "id", function() {
                    return $(this).data("original-name") + _uiCounter;
                })

            _uiCounter++;

            data.formData = {};
            data.submit();
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
                }).attr( 'data-has-id', true )

                // and make it easier for us to figure out the form fields we expect to work with
                // (we don't want fileids_### on this one)
                .end().append( "<input type='hidden' name='fileids' value='" + fileid +"' />");
        } else {
            $(data.context).trigger( "uploaderror", [ { error : data.error } ] );
        }
    })
    .on( 'fileuploadfail', function(e, data) {
        var responseText;
        if ( data.jqXHR && data.jqXHR.responseText ) {
            var response = JSON.parse(data.jqXHR.responseText);
            responseText = response.error;
        }
        if ( ! responseText ) {
            responseText = data.errorThrown;
        }

        $(data.context).trigger( "uploaderror", [ { error: responseText } ] );
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
    })
    // now make sure we upload the metadata in case we tried to submit metadata
    // before we got an id back (from the file upload)
    .on( 'fileuploadstop', function(data) {
        if ( _hasUnsubmitted ) {
            // now submit all form fields...
            _doEditRequest( $('.upload-form').serializeArray() );
            _hasUnsubmitted = false;
        }
    })

    $('.upload-form').submit(function(e) {
        e.preventDefault();
        e.stopPropagation();

        var formFields = $(':input[data-has-id]', this).serializeArray();
        if ( formFields.length < $(this).serializeArray().length ) {
            _hasUnsubmitted = true;
        }

        _doEditRequest( formFields );
    });

    // error handler when uploading an image
    $(".upload-form-preview ul").on( 'uploaderror', function(e, data) {
        $(e.target)
            // error message
            .find( ".progress.success" )
                .replaceWith( "<small class='error' role='alert'>" + data.error + "</small>")
            .end()
            // dim text fields (don't actually disable though, may still want the text inside)
            .find( ":input" )
                .addClass( "disabled" )
                .attr( "aria-invalid", true );

    });
});;
