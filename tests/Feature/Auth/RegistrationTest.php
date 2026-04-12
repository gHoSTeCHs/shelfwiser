<?php

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('registration screen can be rendered', function () {
    $response = $this->get(route('register'));

    $response->assertStatus(200);
});

test('new users can register', function () {
    $response = $this->post(route('register.store'), [
        'fname' => 'Test',
        'lname' => 'User',
        'email' => 'test@example.com',
        'password' => 'P@ssw0rd!',
        'password_confirmation' => 'P@ssw0rd!',
        'company_name' => 'Test Company',
    ]);

    $response->assertSessionHasNoErrors();
    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));
});
