---
title: Kraken Bottle ROV
date: 2026-06-30
category: hardware
summary: Kraken is a small, unmanned, shallow-water remotely operated vehicle (ROV) built around reused 1.5-2 L PET bottles, a Raspberry Pi, a custom control HAT, four shrouded thrusters, and a floating radio hub.
tags: [hardware, rov, raspberry, pi, custom, open source]
status: planning
link: 
repository: 
draft: true
---

Kraken is a small, unmanned, shallow-water remotely operated vehicle (ROV) built around reused 1.5-2 L PET bottles, a Raspberry Pi, a custom control HAT, four shrouded thrusters, and a floating radio hub.

The design package is intentionally conservative:

- The bottles are buoyancy/fairing elements, never electronics pressure housings.
- The default operating depth is 0-2 m. Operation to 3 m is permitted only after the exact bottle and pressure-vessel assemblies pass the documented tests.
- The vehicle is positively buoyant, so loss of power makes it rise.
- A tether carries data between vehicle and surface hub; radio is used only above the water.
- The HAT carries logic and sensing, not raw thruster current.
- This is an unmanned ROV. Nothing in this repository is suitable for human breathing, human diving, or life support.

Kraken is a low-cost inspection ROV built on a rectangular HDPE/PVC frame. Four reused PET bottles sit high and outboard to provide buoyancy and roll stability. A separate pressure tube contains the Raspberry Pi, camera interface, custom HAT, low-voltage electronics, and battery monitoring. Four reversible, shrouded thrusters provide two horizontal and two vertical control channels. The vehicle is trimmed 100-250 g positively buoyant.

A light tether joins the ROV to a floating surface hub. The tether carries 100BASE-TX Ethernet and a redundant half-duplex RS-485 control/telemetry pair. The surface hub contains a second Raspberry Pi, a USB Ethernet adapter, a protected battery, and a weatherproof Wi-Fi access point. The pilot connects to the hub by 2.4 or 5 GHz Wi-Fi. An optional LoRa link may carry low-rate position, health, and “return to surface” commands, but it is not suitable for video or responsive primary piloting.

### Recommended performance envelope

| Property | Prototype target |
|---|---:|
| Operating depth | 0-2 m |
| Conditional maximum depth | 3 m after pressure and bottle tests |
| Tether length | 10 m standard; 20 m after voltage/data tests |
| Vehicle mass in air | 5-8 kg depending on thrusters and battery |
| Displacement | Trim to mass + 0.10-0.25 kg |
| Endurance | 35-70 min typical |
| Horizontal speed | 0.3-0.7 m/s, configuration dependent |
| Video | 720p/30 low-latency target |
| Water | Fresh water first; salt water only after corrosion upgrades |
| Weather | Sheltered water; no current, surf, ice, or boat traffic |

The 3 m limit is not set by the electronics sensor. It is set by the improvised buoyancy bodies, penetrators, pressure tube, tether handling, and recovery risk.

### Functional requirements

1. Pilot shall command surge, yaw, heave, lights, camera, and emergency ascent from shore.
2. ROV shall transmit video and health telemetry to the pilot.
3. Vehicle shall surface after command loss, software crash, low battery, or detected leak.
4. Surface hub shall keep all RF antennas above water.
5. Tether shall be mechanically strain-relieved independently of electrical connectors.
6. Custom HAT shall measure depth, attitude, battery voltage/current, internal temperature, leak state, and tether state.
7. HAT shall provide expansion buses for sonar, water-quality probes, manipulator, and additional lighting.
8. Thruster power shall be independently fused and shall not pass through the HAT.

### Non-goals

- Human occupancy, breathing gas, diver propulsion, or life support.
- Operation beyond visual recovery range.
- Open-water, ocean, surf, current, or navigation around boats.
- Autonomous missions without an attended surface operator.
- Certification as a commercial or scientific instrument.