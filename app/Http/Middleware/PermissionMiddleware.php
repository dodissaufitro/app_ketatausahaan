<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PermissionMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, ...$permissions): Response
    {
        if (!$request->user()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if (!$request->user()->is_active) {
            return response()->json(['message' => 'Your account is inactive.'], 403);
        }

        // Check if user has at least one of the required permissions (OR logic)
        $hasPermission = false;
        foreach ($permissions as $permission) {
            if ($request->user()->hasPermission($permission)) {
                $hasPermission = true;
                break;
            }
        }

        if (!$hasPermission) {
            return response()->json([
                'message' => 'You do not have the required permission.',
            ], 403);
        }

        return $next($request);
    }
}
