<?php

function starter_theme_setup() {
	add_theme_support( 'title-tag' );
}
add_action( 'after_setup_theme', 'starter_theme_setup' );

function starter_theme_scripts() {
	wp_enqueue_style( 'starter-style', get_stylesheet_uri() );
}
add_action( 'wp_enqueue_scripts', 'starter_theme_scripts' );