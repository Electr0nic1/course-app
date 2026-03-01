<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();
        if (!$user) {
            abort(401, 'Unauthenticated.');
        }

        $roleName = $user->role->title;
        if (!$roleName) {
            abort(403, 'Role not set.');
        }

        // allow multiple roles: role:admin,coach
        if (!in_array($roleName, $roles, true)) {
            abort(403, 'Forbidden.');
        }

        return $next($request);
    }
}
