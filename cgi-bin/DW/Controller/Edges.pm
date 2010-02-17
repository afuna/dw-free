#!/usr/bin/perl
#
# DW::Controller::Edges
#
# Outputs an account's edges in JSON format.
#
# Authors:
#      Thomas Thurman <thomas@thurman.org.uk>
#      foxfirefey <skittisheclipse@gmail.com>
#      Mark Smith <mark@dreamwidth.org>
#      Andrea Nall <anall@andreanall.com>
#
# Copyright (c) 2009 by Dreamwidth Studios, LLC.
#
# This program is free software; you may redistribute it and/or modify it under
# the same terms as Perl itself. For a copy of the license, please reference
# 'perldoc perlartistic' or 'perldoc perlgpl'.
#

package DW::Controller::Edges;

use strict;
use warnings;
use DW::Routing;
use DW::Request;
use JSON;

DW::Routing->register_string(  "/data/edges", \&edges_handler, user => 1, format => 'json' );

my $formats = {
    'json' => [ "application/json; charset=utf-8", sub { $_[0]->print( objToJson( $_[1] ) ); } ],
};

sub edges_handler {
    my $opts = shift;
    my $r = DW::Request->get;

    # allow them to pick what format they want the data in, but bail if they ask for one
    # we don't understand
    my $format = $formats->{$opts->format};
    return $r->NOT_FOUND if ! $format;

    # content type early on
    $r->content_type( $format->[0] );

    # Outputs an error message
    my $error_out = sub {
       my ( $code, $message ) = @_;
       $r->status( $code );
       $format->[1]->( $r, { error => $message } );

       return $r->OK;
    };

    # Load the account or error
    return $error_out->(404, 'Need account name as user parameter') unless $opts->username;
    my $u = LJ::load_user_or_identity( $opts->username )
        or return $error_out->( 404, "invalid account");

    # Check for other conditions
    return $error_out->( 410, 'expunged' ) if $u->is_expunged;
    return $error_out->( 403, 'suspended' ) if $u->is_suspended;
    return $error_out->( 404, 'deleted' ) if $u->is_deleted;

    # deal with renamed accounts
    my $renamed_u = $u->get_renamed_user;
    unless ( $renamed_u && $u->equals( $renamed_u ) ) {
        $r->header_out("Location", $renamed_u->journalbase . "/data/edges");
        $r->print( objToJson( { error => 'moved', moved_to => $renamed_u->journalbase . "/data/edges" } ) );
        return $r->REDIRECT;
    }

    # Load appropriate usernames for different accounts
    my $us;

    if ( $u->is_individual ) {
        $us = LJ::load_userids( $u->trusted_userids, $u->watched_userids, $u->trusted_by_userids, $u->watched_by_userids, $u->member_of_userids );
    } elsif ( $u->is_community ) {
        $us = LJ::load_userids( $u->maintainer_userids, $u->moderator_userids, $u->member_userids, $u->watched_by_userids );
    } elsif ( $u->is_syndicated ) {
        $us = LJ::load_userids( $u->watched_by_userids );
    }

    # Contruct the JSON response hash
    my $response = {};

    # all accounts have this
    $response->{account_id} = $u->userid;
    $response->{name} = $u->user;
    $response->{display_name} = $u->display_name if $u->is_identity;
    $response->{account_type} = $u->journaltype;
    $response->{watched_by} = [ $u->watched_by_userids ];

    # different individual and community edges
    if ( $u->is_individual ) {
        $response->{trusted} = [ $u->trusted_userids ];
        $response->{watched} = [ $u->watched_userids ];
        $response->{trusted_by} = [ $u->trusted_by_userids ];
        $response->{member_of} = [ $u->member_of_userids ];
    } elsif ( $u->is_community ) {
        $response->{maintainer} = [ $u->maintainer_userids ];
        $response->{moderator} = [ $u->moderator_userids ];
        $response->{member} = [ $u->member_userids ];
    }

    # now dump information about the users we loaded
    $response->{accounts} = {
        map { $_ => { name => $us->{$_}->user, type => $us->{$_}->journaltype } } keys %$us
    };

    $format->[1]->( $r, $response );

    return $r->OK;
}

1;
