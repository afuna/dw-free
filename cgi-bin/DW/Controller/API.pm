#!/usr/bin/perl
#
# DW::Controller::API
#
# API base implementation and helper functions.
#
# Authors:
#      Mark Smith <mark@dreamwidth.org>
#
# Copyright (c) 2013 by Dreamwidth Studios, LLC.
#
# This program is free software; you may redistribute it and/or modify it under
# the same terms as Perl itself. For a copy of the license, please reference
# 'perldoc perlartistic' or 'perldoc perlgpl'.
#

package DW::Controller::API;

use strict;
use warnings;
use DW::Routing;
use DW::Request;
use DW::Controller;
use LJ::JSON;

use base qw/ Exporter /;
@DW::Controller::API::EXPORT = qw/ api_ok api_error /;

# FIXME: export some of these to callers

# Usage: return api_error( 'message' )
# Returns a standard format JSON error message.
sub api_error {
    return api_ok( {
        success => 0,
        error => sprintf( shift, @_ ),
    } );
}

# Usage: return api( { ... } )
# Converts an object to JSON and outputs it.
sub api_ok {
    my $res = shift;
    $res = { result => $res } unless ref $res eq 'HASH';
    $res->{success} //= 1;

    my $r = DW::Request->get;
    $r->print( to_json( $res ) );
    $r->status( 200 );
    return;
}

1;
