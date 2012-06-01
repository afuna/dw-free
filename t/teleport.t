#!/usr/bin/perl -w
use strict;

use Test::More;
plan tests => 3;

use DW::Teleporter;

my $teleporter = DW::Teleporter->new;

my @out = $teleporter->energize( @in );
