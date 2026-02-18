<?php

namespace App\Http\Controllers;

use App\Models\Agenda;
use Illuminate\Http\Request;

class AgendaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $agendas = Agenda::orderBy('start_date', 'desc')->get();
        return response()->json($agendas);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'location' => 'nullable|string|max:255',
            'category' => 'required|string|in:meeting,event,reminder,task',
            'status' => 'nullable|string|in:scheduled,ongoing,completed,cancelled',
            'created_by' => 'nullable|string|max:255',
        ]);

        $agenda = Agenda::create($validated);
        return response()->json($agenda, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $agenda = Agenda::findOrFail($id);
        return response()->json($agenda);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $agenda = Agenda::findOrFail($id);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'location' => 'nullable|string|max:255',
            'category' => 'required|string|in:meeting,event,reminder,task',
            'status' => 'nullable|string|in:scheduled,ongoing,completed,cancelled',
            'created_by' => 'nullable|string|max:255',
        ]);

        $agenda->update($validated);
        return response()->json($agenda);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $agenda = Agenda::findOrFail($id);
        $agenda->delete();
        return response()->json(['message' => 'Agenda deleted successfully']);
    }
}
